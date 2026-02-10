"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
  Minus,
  FileText,
  Search,
  Filter,
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
  { key: "memoTitle", label: "ชื่อโครงการ / แหล่งทุน", width: "w-[180px]" },
  { key: "department", label: "ภาควิชา", width: "w-[140px]" },
  { key: "projectHead", label: "ผู้ดูแลโครงการ", width: "w-[160px]" },
  { key: "_meetings", label: "มติที่ประชุม (ล่าสุด)", width: "w-[180px]" },
  { key: "vendorCode", label: "รหัสเจ้าหนี้", width: "w-[140px]" },
  { key: "_costCenter", label: "ศูนย์ต้นทุน", width: "w-[130px]" },
  { key: "_maintenanceFee", label: "ค่าบำรุงฯ (บาท)", width: "w-[130px]" },
  { key: "utilities", label: "ค่าไฟฟ้าตามงบประมาณ (บาท)", width: "w-[120px]" }, // Read Only
  { key: "_electricityFeeActual", label: "ค่าไฟฟ้าตามจริง (บาท)", width: "w-[120px]"}, // Editable
];

export default function ProjectTrackingPage() {
  const [userRole, setUserRole] = useState<UserRole>("งานวิจัย");
  const [projects, setProjects] = useState<EnhancedProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  
  // Individual cell editing state
  const [editingCell, setEditingCell] = useState<{
    projectId: string;
    field: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [savingCell, setSavingCell] = useState<string | null>(null);

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

  // Start editing a cell
  const handleStartEdit = (projectId: string, field: string, currentValue: string) => {
    setEditingCell({ projectId, field });
    setEditingValue(currentValue || "");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  // Save individual cell edit
  const handleSaveCell = async () => {
    if (!editingCell) return;

    const cellKey = `${editingCell.projectId}-${editingCell.field}`;
    setSavingCell(cellKey);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // TODO: Replace with actual API call
      console.log("Saving:", {
        projectId: editingCell.projectId,
        field: editingCell.field,
        value: editingValue,
      });

      // Update local state
      handleUpdateField(
        editingCell.projectId,
        editingCell.field as keyof EnhancedProjectData,
        editingValue,
      );

      setEditingCell(null);
      setEditingValue("");
    } catch (error) {
      console.error("Error saving cell:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSavingCell(null);
    }
  };

  const handleSaveMeetings = async () => {
    if (editingMeetings) {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // TODO: Replace with actual API call
        console.log("Saving meetings:", {
          projectId: editingMeetings.projectId,
          meetings: editingMeetings.list,
        });

        handleUpdateField(
          editingMeetings.projectId,
          "_meetings",
          editingMeetings.list,
        );
        setEditingMeetings(null);
      } catch (error) {
        console.error("Error saving meetings:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    }
  };

  const hasPermission = (fieldKey: string) => {
    const allowedRoles = ROLE_PERMISSIONS[fieldKey];
    return allowedRoles && allowedRoles.includes(userRole);
  };

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !query ||
        p.receiptNumber.toLowerCase().includes(query) ||
        p.memoTitle.toLowerCase().includes(query) ||
        p.projectHead.toLowerCase().includes(query) ||
        p.vendorCode.toLowerCase().includes(query);
      
      const matchesDepartment =
        departmentFilter === "all" || p.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  }, [projects, searchQuery, departmentFilter]);

  const departments = useMemo(() => {
    const depts = new Set(projects.map((p) => p.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [projects]);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-3 md:px-6 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between shadow-sm shrink-0 z-20 gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
              <TableIcon size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800">
                ระบบติดตามโครงการ
              </h1>
              <p className="text-xs text-slate-500">
                จัดการข้อมูลโดย:{" "}
                <span className="font-bold text-indigo-600">{userRole}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                type="text"
                placeholder="ค้นหาโครงการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full lg:w-64 text-sm"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md border border-slate-200 flex-shrink-0">
              <Filter className="text-slate-500 ml-2" size={14} />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-sm bg-white border-0 rounded px-2 py-1 cursor-pointer focus:ring-0 text-slate-700 shadow-sm font-medium"
              >
                <option value="all">ทุกภาควิชา</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md border border-slate-200 flex-shrink-0">
              <span className="text-xs font-semibold text-slate-500 pl-2 hidden md:inline">
                เลือกบทบาท:
              </span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="text-sm bg-white border-0 rounded px-2 py-1 cursor-pointer focus:ring-0 text-slate-700 shadow-sm font-medium"
              >
                <option value="ภาควิชา">ภาควิชา (ไม่แก้ไข)</option>
                <option value="งานวิจัย">งานวิจัย (1,2)</option>
                <option value="งานแผน">งานแผน (4)</option>
                <option value="งานคลัง">งานคลัง (3)</option>
                <option value="กายภาพ">กายภาพ (5,7)</option>
              </select>
            </div>
          </div>
        </header>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-slate-100/50 p-2 md:p-4">
          <Card className="border-none shadow-lg overflow-hidden h-full flex flex-col bg-white rounded-lg">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full min-w-max border-collapse text-left">
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
                          <Link
                            href="/projects"
                            className="text-sm font-semibold text-indigo-900 hover:text-indigo-600 hover:underline transition-colors cursor-pointer block"
                          >
                            {project.id}
                          </Link>
                          <div className="text-xs text-slate-400 mt-1">
                            {project.projectCode}
                          </div>
                        </td>

                        {/* 2. ชื่อโครงการ */}
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="flex flex-col gap-1 max-w-[500px]">
                            <span
                              className="text-sm text-slate-700 font-medium break-words line-clamp-3 leading-relaxed"
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

                        {/* 3. ภาควิชา */}
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="text-sm text-slate-700">
                            {project.department || "-"}
                          </div>
                        </td>

                        {/* 4. ผู้ดูแลโครงการ */}
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="text-sm text-slate-700">
                            {project.projectHead || "-"}
                          </div>
                        </td>

                        {/* 5. มติประชุม */}
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="flex flex-col gap-2">
                            <div className="bg-white border border-slate-200 rounded-md p-2 shadow-sm flex items-center justify-between">
                              <div>
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
                                {hasPermission("_meetings") ? (
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
                          {editingCell?.projectId === project.id &&
                          editingCell?.field === "vendorCode" ? (
                            <div className="flex gap-1 items-center">
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveCell();
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                className="h-8 text-sm"
                                placeholder="รหัสเจ้าหนี้"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                                onClick={handleSaveCell}
                                disabled={savingCell === `${project.id}-vendorCode`}
                              >
                                {savingCell === `${project.id}-vendorCode` ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:bg-slate-50"
                                onClick={handleCancelEdit}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group">
                              <div className="text-sm text-slate-700 font-mono">
                                {project.vendorCode || "-"}
                              </div>
                              {hasPermission("vendorCode") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleStartEdit(
                                      project.id,
                                      "vendorCode",
                                      project.vendorCode,
                                    )
                                  }
                                >
                                  <Pencil size={12} className="text-indigo-600" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. Cost Center */}
                        <td className="p-3 align-top border-r border-slate-100">
                          {editingCell?.projectId === project.id &&
                          editingCell?.field === "_costCenter" ? (
                            <div className="flex gap-1 items-center">
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveCell();
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                className="h-8 text-sm"
                                placeholder="ศูนย์ต้นทุน"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                                onClick={handleSaveCell}
                                disabled={savingCell === `${project.id}-_costCenter`}
                              >
                                {savingCell === `${project.id}-_costCenter` ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:bg-slate-50"
                                onClick={handleCancelEdit}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group">
                              <div className="text-sm text-slate-700 font-mono">
                                {project._costCenter || "-"}
                              </div>
                              {hasPermission("_costCenter") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleStartEdit(
                                      project.id,
                                      "_costCenter",
                                      project._costCenter || "",
                                    )
                                  }
                                >
                                  <Pencil size={12} className="text-indigo-600" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 6. ค่าบำรุงฯ */}
                        <td className="p-3 align-top border-r border-slate-100">
                          {editingCell?.projectId === project.id &&
                          editingCell?.field === "_maintenanceFee" ? (
                            <div className="flex gap-1 items-center">
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveCell();
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                className="h-8 text-sm text-right"
                                placeholder="0.00"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                                onClick={handleSaveCell}
                                disabled={savingCell === `${project.id}-_maintenanceFee`}
                              >
                                {savingCell === `${project.id}-_maintenanceFee` ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:bg-slate-50"
                                onClick={handleCancelEdit}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group">
                              <div className="text-sm text-right text-slate-700 font-mono flex-1">
                                {project._maintenanceFee || "-"}
                              </div>
                              {hasPermission("_maintenanceFee") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleStartEdit(
                                      project.id,
                                      "_maintenanceFee",
                                      project._maintenanceFee || "",
                                    )
                                  }
                                >
                                  <Pencil size={12} className="text-indigo-600" />
                                </Button>
                              )}
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
                          {editingCell?.projectId === project.id &&
                          editingCell?.field === "_electricityFeeActual" ? (
                            <div className="flex gap-1 items-center">
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveCell();
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                className="h-8 text-sm text-right font-bold text-indigo-700 border-indigo-200 focus:border-indigo-500"
                                placeholder="0.00"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                                onClick={handleSaveCell}
                                disabled={savingCell === `${project.id}-_electricityFeeActual`}
                              >
                                {savingCell === `${project.id}-_electricityFeeActual` ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:bg-slate-50"
                                onClick={handleCancelEdit}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group">
                              <div
                                className={`text-sm text-right font-mono flex-1 ${project._electricityFeeActual ? "text-indigo-700 font-bold" : "text-slate-300 italic"}`}
                              >
                                {project._electricityFeeActual || "-"}
                              </div>
                              {hasPermission("_electricityFeeActual") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleStartEdit(
                                      project.id,
                                      "_electricityFeeActual",
                                      project._electricityFeeActual || "",
                                    )
                                  }
                                >
                                  <Pencil size={12} className="text-indigo-600" />
                                </Button>
                              )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-xl flex flex-col max-h-[85vh] md:max-h-[80vh] animate-in zoom-in-95 duration-200">
              <div className="p-2 md:p-3 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-indigo-600" size={18} />
                    จัดการมติที่ประชุม
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID: {editingMeetings.projectId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingMeetings(null)}
                  className="rounded-full h-8 w-8"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="p-3 md:p-4 overflow-y-auto flex-1 bg-white">
                {hasPermission("_meetings") ? (
                  <div className="space-y-3">
                    {editingMeetings.list.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="flex items-center gap-3"
                      >
                        <span className="text-slate-400 w-6 text-sm">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-3">
                          <div className="flex-1 md:flex-[2]">
                            <select
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
                              className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500 h-9"
                            >
                              <option value="BOARD">มติที่ประชุมคณะ</option>
                              <option value="DEAN">มติคณบดี</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder="ครั้งที่"
                              value={m.no}
                              onChange={(e) => {
                                const newList = [...editingMeetings.list];
                                newList[idx].no = e.target.value;
                                setEditingMeetings({
                                  ...editingMeetings,
                                  list: newList,
                                });
                              }}
                              className="h-9"
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder="วันที่"
                              value={m.date}
                              onChange={(e) => {
                                const newList = [...editingMeetings.list];
                                newList[idx].date = e.target.value;
                                setEditingMeetings({
                                  ...editingMeetings,
                                  list: newList,
                                });
                              }}
                              className="h-9"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
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
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingMeetings.list.length > 0 ? (
                      editingMeetings.list.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className="py-2 border-b border-slate-200 last:border-0"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-slate-400 min-w-[18px] shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 text-xs md:text-sm text-slate-700">
                              <div className="flex-1 md:flex-[2]">
                                <span className="text-[10px] text-slate-400 uppercase block mb-0.5 md:hidden">ประเภท</span>
                                <span className="font-medium">
                                  {m.type === "BOARD"
                                    ? "มติที่ประชุมคณะ"
                                    : "มติคณบดี"}
                                </span>
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] text-slate-400 uppercase block mb-0.5 md:hidden">ครั้งที่</span>
                                <span>ครั้งที่ {m.no || "-"}</span>
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] text-slate-400 uppercase block mb-0.5 md:hidden">วันที่</span>
                                <span className="text-slate-500">
                                  {m.date || "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-400 py-6 text-sm">
                        ไม่มีข้อมูลมติที่ประชุม
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-2 md:p-3 border-t bg-slate-50 flex flex-col sm:flex-row justify-end gap-2 rounded-b-xl">
                {hasPermission("_meetings") ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setEditingMeetings(null)}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      onClick={handleSaveMeetings}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      ยืนยัน
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setEditingMeetings(null)}
                  >
                    ปิด
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
