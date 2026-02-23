"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import {
  Pencil,
  Save,
  Loader2,
  Table as TableIcon,
  Eye,
  X,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";

// --- 1. Data Interface ---
interface ProjectData {
  id: string;
  receiptNumber: string;
  projectCode: string;
  boardMeetingNo: string;
  boardMeetingDate: string;
  deanDecisionNo: string;
  deanDecisionDate: string;
  purpose: string;
  memoTitle: string;
  department: string;
  projectHead: string;
  totalBudget: string;
  compensation: string;
  operatingCost: string;
  materialCost: string;
  utilities: string; // อันนี้คือ "งบตั้งต้น" (Read Only)
  academicFund: string;
  generalReserve: string;
  startDate: string;
  endDate: string;
  fundOwner: string;
  vendorCode: string;
  serviceType: string;
  strategyType: string;
  targetGroup: string;
  participantCount: string;
  projectDescription: string;
  amountGovExternal: string;
  amountPrivateExternal: string;
  amountForeignExternal: string;
  amountUnivRevenue: string;
  status1: string;
  status1Date: string;
  status2: string;
  status2Date: string;
  status3: string;
  status3Date: string;
  status4: string;
  status4Date: string;
  status5: string;
  status5Date: string;
  responsible: string;
  docNumber: string;
  docDate: string;
  docLink: string;
}

// --- 2. Enhanced Interface ---
interface MeetingRecord {
  id: string;
  type: "BOARD" | "DEAN";
  no: string;
  date: string;
}

interface EnhancedProjectData extends ProjectData {
  _meetings: MeetingRecord[];
  _costCenter?: string;
  _maintenanceFee?: string;
  _electricityFeeActual?: string; // เก็บแยก: ค่าไฟฟ้าตามจริง (Editable)
}

type UserRole = "ภาควิชา" | "งานวิจัย" | "งานแผน" | "งานคลัง" | "กายภาพ";

// --- Permissions Configuration ---
// กำหนดว่า Column ไหน ใครแก้ได้บ้าง
const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  _meetings: ["งานวิจัย", "งานแผน"],
  vendorCode: ["งานคลัง"],
  _costCenter: ["งานแผน"],
  _maintenanceFee: ["กายภาพ"],
  _electricityFeeActual: ["กายภาพ"], // ** ช่องจ่ายจริง กายภาพแก้ได้ **
  // utilities ไม่ใส่ในนี้ = Read Only เสมอ
};

// --- Column Definitions (แยก Column ค่าไฟ) ---
const COLUMNS = [
  { key: "receiptNumber", label: "เลขที่รับ", width: "w-[140px]" },
  { key: "memoTitle", label: "ชื่อโครงการ / แหล่งทุน", width: "w-[240px]" },
  { key: "_meetings", label: "1-2. มติที่ประชุม", width: "w-[180px]" },
  { key: "vendorCode", label: "3. รหัสเจ้าหนี้", width: "w-[140px]" },
  { key: "_costCenter", label: "4. ศูนย์ต้นทุน", width: "w-[130px]" },
  { key: "_maintenanceFee", label: "5. ค่าบำรุงฯ", width: "w-[130px]" },
  { key: "utilities", label: "6. ค่าไฟฟ้าตามงบประมาณ", width: "w-[120px]" }, // Read Only
  {
    key: "_electricityFeeActual",
    label: "7. ค่าไฟฟ้าตามจริง",
    width: "w-[120px]",
  }, // Editable
];

export default function ProjectTrackingPage() {
  const [userRole, setUserRole] = useState<UserRole>("งานวิจัย");
  const [projects, setProjects] = useState<EnhancedProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingMeetings, setEditingMeetings] = useState<{
    projectId: string;
    list: MeetingRecord[];
  } | null>(null);

  // --- Load & Transform ---
  useEffect(() => {
    const loadMockData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/mock.json");
        const data: ProjectData[] = await response.json();

        const enhancedData: EnhancedProjectData[] = data.map((item) => {
          // Transform Meetings
          const meetings: MeetingRecord[] = [];
          if (item.boardMeetingNo)
            meetings.push({
              id: `board-${item.id}`,
              type: "BOARD",
              no: item.boardMeetingNo,
              date: item.boardMeetingDate,
            });
          if (item.deanDecisionNo)
            meetings.push({
              id: `dean-${item.id}`,
              type: "DEAN",
              no: item.deanDecisionNo,
              date: item.deanDecisionDate,
            });

          return {
            ...item,
            _meetings: meetings,
            _costCenter: "",
            _maintenanceFee: "",
            _electricityFeeActual: "", // ค่าเริ่มต้นว่างไว้
          };
        });

        setProjects(enhancedData);
      } catch (error) {
        console.error("Failed to load project data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMockData();
  }, []);

  // --- Handlers ---
  const handleUpdateField = (
    id: string,
    field: keyof EnhancedProjectData,
    value: string | MeetingRecord[],
  ) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleSaveMeetings = () => {
    if (editingMeetings) {
      handleUpdateField(
        editingMeetings.projectId,
        "_meetings",
        editingMeetings.list,
      );
      setEditingMeetings(null);
    }
  };

  const hasPermission = (fieldKey: string) => {
    const allowedRoles = ROLE_PERMISSIONS[fieldKey];
    return allowedRoles && allowedRoles.includes(userRole);
  };

  const filteredProjects = useMemo(() => {
    return projects;
  }, [projects]);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
              <TableIcon size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                ระบบติดตามโครงการ
              </h1>
              <p className="text-xs text-slate-500">
                จัดการข้อมูลโดย:{" "}
                <span className="font-bold text-indigo-600">{userRole}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 pl-2">
                เลือกบทบาท:
              </span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="text-sm bg-white border-0 rounded px-2 py-1 cursor-pointer focus:ring-0 text-slate-700 shadow-sm font-medium"
              >
                <option value="งานวิจัย">งานวิจัย (1,2)</option>
                <option value="งานแผน">งานแผน (4)</option>
                <option value="งานคลัง">งานคลัง (3)</option>
                <option value="กายภาพ">กายภาพ (5,7)</option>
              </select>
            </div>

            <Button
              onClick={() => {
                if (isEditMode) {
                  setIsSaving(true);
                  setTimeout(() => {
                    setIsSaving(false);
                    setIsEditMode(false);
                  }, 500);
                } else {
                  setIsEditMode(true);
                }
              }}
              className={`h-9 px-5 transition-all font-medium ${
                isEditMode
                  ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-100"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isSaving ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : isEditMode ? (
                <Save className="mr-2" size={16} />
              ) : (
                <Pencil className="mr-2" size={16} />
              )}
              {isSaving ? "บันทึก..." : isEditMode ? "บันทึกข้อมูล" : "แก้ไข"}
            </Button>
          </div>
        </header>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-slate-100/50 p-4">
          <Card className="border-none shadow-lg overflow-hidden h-full flex flex-col bg-white rounded-lg">
            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-800 text-slate-200 sticky top-0 z-10 text-xs uppercase tracking-wider shadow-sm">
                  <tr>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={`p-3 font-semibold border-r border-slate-700/50 last:border-0 ${col.width}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={COLUMNS.length}
                        className="p-10 text-center text-slate-400"
                      >
                        กำลังโหลดข้อมูล...
                      </td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={COLUMNS.length}
                        className="p-10 text-center text-slate-400"
                      >
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className={`group hover:bg-slate-50`}
                      >
                        {/* 1. เลขที่รับ */}
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="text-sm font-semibold text-indigo-900">
                            {project.receiptNumber}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {project.projectCode}
                          </div>
                        </td>

                        {/* 2. ชื่อโครงการ */}
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="flex flex-col gap-1">
                            <span
                              className="text-sm text-slate-700 font-medium line-clamp-2"
                              title={project.memoTitle}
                            >
                              {project.memoTitle}
                            </span>
                            {project.fundOwner && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit truncate max-w-full border">
                                ทุน: {project.fundOwner}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. มติประชุม */}
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="flex flex-col gap-2">
                            <div className="bg-white border border-slate-200 rounded-md p-2 shadow-sm flex items-center justify-between">
                              <div>
                                <div className="text-[10px] uppercase text-slate-400 font-bold">
                                  ล่าสุด
                                </div>
                                <div className="text-sm font-semibold text-slate-700">
                                  {project._meetings.length > 0
                                    ? `ครั้งที่ ${project._meetings[project._meetings.length - 1].no}`
                                    : "-"}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setEditingMeetings({
                                    projectId: project.id,
                                    list: [...project._meetings],
                                  })
                                }
                                className="h-7 w-7 rounded-full hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                {isEditMode && hasPermission("_meetings") ? (
                                  <Pencil size={12} />
                                ) : (
                                  <Eye size={12} />
                                )}
                              </Button>
                            </div>
                          </div>
                        </td>

                        {/* 4. Vendor */}
                        <td className="p-3 align-top border-r border-slate-100">
                          {isEditMode && hasPermission("vendorCode") ? (
                            <Input
                              value={project.vendorCode}
                              onChange={(e) =>
                                handleUpdateField(
                                  project.id,
                                  "vendorCode",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-sm"
                            />
                          ) : (
                            <div className="text-sm text-slate-700 font-mono">
                              {project.vendorCode || "-"}
                            </div>
                          )}
                        </td>

                        {/* 5. Cost Center */}
                        <td className="p-3 align-top border-r border-slate-100">
                          {isEditMode && hasPermission("_costCenter") ? (
                            <Input
                              value={project._costCenter}
                              onChange={(e) =>
                                handleUpdateField(
                                  project.id,
                                  "_costCenter",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-sm"
                            />
                          ) : (
                            <div className="text-sm text-slate-700 font-mono">
                              {project._costCenter || "-"}
                            </div>
                          )}
                        </td>

                        {/* 6. ค่าบำรุงฯ */}
                        <td className="p-3 align-top border-r border-slate-100">
                          {isEditMode && hasPermission("_maintenanceFee") ? (
                            <Input
                              value={project._maintenanceFee}
                              onChange={(e) =>
                                handleUpdateField(
                                  project.id,
                                  "_maintenanceFee",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-sm text-right"
                            />
                          ) : (
                            <div className="text-sm text-right text-slate-700 font-mono">
                              {project._maintenanceFee || "-"}
                            </div>
                          )}
                        </td>

                        {/* 7.1 ค่าไฟ (งบตั้งต้น) - Read Only */}
                        <td className="p-3 align-top border-r border-slate-100 bg-slate-50/50">
                          <div className="text-sm text-right text-slate-500 font-mono">
                            {project.utilities || "-"}
                          </div>
                        </td>

                        {/* 7.2 ค่าไฟ (จ่ายจริง) - Editable */}
                        <td className="p-3 align-top border-r border-slate-100 bg-indigo-50/10">
                          {isEditMode &&
                          hasPermission("_electricityFeeActual") ? (
                            <Input
                              value={project._electricityFeeActual}
                              onChange={(e) =>
                                handleUpdateField(
                                  project.id,
                                  "_electricityFeeActual",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-sm text-right font-bold text-indigo-700 border-indigo-200 focus:border-indigo-500"
                            />
                          ) : (
                            <div
                              className={`text-sm text-right font-mono ${project._electricityFeeActual ? "text-indigo-700 font-bold" : "text-slate-300 italic"}`}
                            >
                              {project._electricityFeeActual || "-"}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* --- MODAL: Meetings Management (เหมือนเดิม) --- */}
        {editingMeetings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-indigo-600" size={20} />
                    จัดการมติที่ประชุม
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ID: {editingMeetings.projectId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingMeetings(null)}
                  className="rounded-full"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-white">
                <div className="space-y-4">
                  {editingMeetings.list.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="relative group flex items-start gap-3 p-3 border rounded-lg bg-slate-50"
                    >
                      <div className="mt-2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            ประเภท
                          </label>
                          <select
                            disabled={
                              !isEditMode || !hasPermission("_meetings")
                            }
                            value={m.type}
                            onChange={(e) => {
                              const newList = [...editingMeetings.list];
                              newList[idx].type = e.target.value as
                                | "BOARD"
                                | "DEAN";
                              setEditingMeetings({
                                ...editingMeetings,
                                list: newList,
                              });
                            }}
                            className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500"
                          >
                            <option value="BOARD">มติที่ประชุมคณะ</option>
                            <option value="DEAN">มติคณบดี</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            ครั้งที่
                          </label>
                          <Input
                            disabled={
                              !isEditMode || !hasPermission("_meetings")
                            }
                            value={m.no}
                            onChange={(e) => {
                              const newList = [...editingMeetings.list];
                              newList[idx].no = e.target.value;
                              setEditingMeetings({
                                ...editingMeetings,
                                list: newList,
                              });
                            }}
                            className="h-9 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            วันที่
                          </label>
                          <Input
                            disabled={
                              !isEditMode || !hasPermission("_meetings")
                            }
                            value={m.date}
                            onChange={(e) => {
                              const newList = [...editingMeetings.list];
                              newList[idx].date = e.target.value;
                              setEditingMeetings({
                                ...editingMeetings,
                                list: newList,
                              });
                            }}
                            className="h-9 bg-white"
                          />
                        </div>
                      </div>

                      {isEditMode && hasPermission("_meetings") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newList = editingMeetings.list.filter(
                              (_, i) => i !== idx,
                            );
                            setEditingMeetings({
                              ...editingMeetings,
                              list: newList,
                            });
                          }}
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}

                  {isEditMode && hasPermission("_meetings") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newItem: MeetingRecord = {
                          id: `new-${Date.now()}`,
                          type: "BOARD",
                          no: "",
                          date: "",
                        };
                        setEditingMeetings({
                          ...editingMeetings,
                          list: [...editingMeetings.list, newItem],
                        });
                      }}
                      className="w-full border-dashed py-4 text-slate-500 hover:text-indigo-600 hover:border-indigo-300"
                    >
                      <Plus className="mr-2" size={16} /> เพิ่มรายการใหม่
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                <Button
                  variant="outline"
                  onClick={() => setEditingMeetings(null)}
                >
                  ยกเลิก
                </Button>
                {isEditMode && hasPermission("_meetings") && (
                  <Button
                    onClick={handleSaveMeetings}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    ยืนยัน
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
