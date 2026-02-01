"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Save,
  Loader2,
  Search,
  ArrowLeftRight,
  Table as TableIcon,
  Eye, // ✅ Added Eye icon
  X, // ✅ Added X icon
} from "lucide-react";

/**
 * RBAC CONFIGURATION
 */
type UserRole = "ภาควิชา" | "งานวิจัย" | "งานแผน" | "งานคลัง" | "กายภาพ";

// Permissions mapping
const EDIT_PERMISSIONS: Record<string, UserRole> = {
  receiptNumber: "งานวิจัย",
  boardMeetingNo: "งานวิจัย",
  boardMeetingDate: "งานวิจัย",
  deanDecisionNo: "งานวิจัย",
  deanDecisionDate: "งานวิจัย",
  status1: "งานวิจัย",
  status1Date: "งานวิจัย",
  status2: "งานวิจัย",
  status2Date: "งานวิจัย",
  status3: "งานวิจัย",
  status3Date: "งานวิจัย",
  status4: "งานวิจัย",
  status4Date: "งานวิจัย",
  status5: "งานวิจัย",
  status5Date: "งานวิจัย",
  vendorCode: "งานคลัง",
  costCenter: "งานแผน",
  maintenanceFee: "กายภาพ",
  electricityFee: "กายภาพ",
};

const ROLE_COLORS: Record<UserRole, string> = {
  งานวิจัย: "bg-blue-100 border-blue-300 text-blue-700",
  งานคลัง: "bg-amber-100 border-amber-300 text-amber-700",
  งานแผน: "bg-green-100 border-green-300 text-green-700",
  กายภาพ: "bg-purple-100 border-purple-300 text-purple-700",
  ภาควิชา: "bg-slate-100 border-slate-300 text-slate-700",
};

// Data Interface
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
  utilities: string;
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

type ColumnDef = {
  key: keyof ProjectData;
  label: string;
  width: string;
  isNumeric?: boolean;
};

// MASTER COLUMN LIST
const ALL_COLUMNS: ColumnDef[] = [
  { key: "receiptNumber", label: "เลขที่รับ วจบ", width: "min-w-[120px]" },
  { key: "projectCode", label: "รหัสโครงการ", width: "min-w-[100px]" },
  {
    key: "boardMeetingNo",
    label: "ประชุมบอร์ด ครั้งที่",
    width: "min-w-[100px]",
  },
  {
    key: "boardMeetingDate",
    label: "ประชุมบอร์ด วันที่",
    width: "min-w-[100px]",
  },
  { key: "deanDecisionNo", label: "มติคณบดี ครั้งที่", width: "min-w-[100px]" },
  { key: "deanDecisionDate", label: "มติคณบดี วันที่", width: "min-w-[100px]" },
  { key: "purpose", label: "เพื่อดำเนินการ", width: "min-w-[150px]" },
  { key: "memoTitle", label: "ชื่อบันทึกข้อความ", width: "min-w-[250px]" }, // ✅ Increased width slightly
  { key: "department", label: "ภาควิชา/หน่วยงาน", width: "min-w-[120px]" },
  { key: "projectHead", label: "หัวหน้าโครงการ", width: "min-w-[120px]" },
  {
    key: "totalBudget",
    label: "งบประมาณรวม",
    width: "min-w-[100px]",
    isNumeric: true,
  },
  {
    key: "compensation",
    label: "ค่าตอบแทน",
    width: "min-w-[100px]",
    isNumeric: true,
  },
  {
    key: "operatingCost",
    label: "ค่าใช้สอย",
    width: "min-w-[100px]",
    isNumeric: true,
  },
  {
    key: "materialCost",
    label: "ค่าวัสดุ",
    width: "min-w-[100px]",
    isNumeric: true,
  },
  {
    key: "utilities",
    label: "ค่าสาธารณูปโภค (≥5%)",
    width: "min-w-[120px]",
    isNumeric: true,
  },
  {
    key: "academicFund",
    label: "เงินอุดหนุนพัฒนาวิชาการ (คณะ) (≥10%)",
    width: "min-w-[150px]",
    isNumeric: true,
  },
  {
    key: "generalReserve",
    label: "เงินสำรองทั่วไป (≥5%)",
    width: "min-w-[120px]",
    isNumeric: true,
  },
  { key: "startDate", label: "วันเริ่มต้น", width: "min-w-[100px]" },
  { key: "endDate", label: "วันสิ้นสุด", width: "min-w-[100px]" },
  { key: "fundOwner", label: "เจ้าของแหล่งทุน", width: "min-w-[120px]" },
  { key: "vendorCode", label: "รหัสเจ้าหนี้ (Vendor)", width: "min-w-[120px]" },
  {
    key: "serviceType",
    label: "ประเภทงานบริการวิชาการ",
    width: "min-w-[150px]",
  },
  {
    key: "strategyType",
    label: "ประเภทยุทธศาสตร์ (คก.บริการวิชาการ)",
    width: "min-w-[150px]",
  },
  { key: "targetGroup", label: "กลุ่มเป้าหมาย", width: "min-w-[120px]" },
  {
    key: "participantCount",
    label: "จำนวน ผู้รับบริการ",
    width: "min-w-[100px]",
    isNumeric: true,
  },
  {
    key: "projectDescription",
    label: "รายละเอียดโครงการแบบย่อ (200ตัวอักษร)",
    width: "min-w-[250px]",
  },
  {
    key: "amountGovExternal",
    label: "ภายนอกภาครัฐ จำนวนเงิน(บาท)",
    width: "min-w-[150px]",
    isNumeric: true,
  },
  {
    key: "amountPrivateExternal",
    label: "ภายนอกภาคเอกชน จำนวนเงิน(บาท)",
    width: "min-w-[150px]",
    isNumeric: true,
  },
  {
    key: "amountForeignExternal",
    label: "ภายนอกต่างประเทศ จำนวนเงิน(บาท)",
    width: "min-w-[150px]",
    isNumeric: true,
  },
  {
    key: "amountUnivRevenue",
    label: "รายได้มหาวิทยาลัย จำนวนเงิน(บาท)",
    width: "min-w-[150px]",
    isNumeric: true,
  },
  { key: "status1", label: "สถานะการดำเนินงาน 1", width: "min-w-[150px]" },
  { key: "status1Date", label: "วันที่", width: "min-w-[100px]" },
  { key: "status2", label: "สถานะการดำเนินงาน 2", width: "min-w-[150px]" },
  { key: "status2Date", label: "วันที่", width: "min-w-[100px]" },
  { key: "status3", label: "สถานะการดำเนินงาน 3", width: "min-w-[150px]" },
  { key: "status3Date", label: "วันที่", width: "min-w-[100px]" },
  { key: "status4", label: "สถานะการดำเนินงาน 4", width: "min-w-[150px]" },
  { key: "status4Date", label: "วันที่", width: "min-w-[100px]" },
  { key: "status5", label: "สถานะการดำเนินงาน 5", width: "min-w-[150px]" },
  { key: "status5Date", label: "วันที่", width: "min-w-[100px]" },
  { key: "responsible", label: "ผู้รับผิดชอบ", width: "min-w-[120px]" },
  { key: "docNumber", label: "เลขที่หนังสือ", width: "min-w-[120px]" },
  { key: "docDate", label: "วันที่เลขที่หนังสือ", width: "min-w-[120px]" },
  {
    key: "docLink",
    label: "LINK ประกาศเอกสารที่เกี่ยวข้อง",
    width: "min-w-[200px]",
  },
];

export default function ComprehensiveProjectPage() {
  const [userRole, setUserRole] = useState<UserRole>("งานวิจัย");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<string>("ทั้งหมด");

  // ✅ State for "Full Text View" Modal
  const [viewingFullText, setViewingFullText] = useState<{
    title: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadMockData = async () => {
      const response = await fetch("/mock.json");
      const data = await response.json();
      setProjects(data);
    };
    loadMockData();
  }, []);

  const handleUpdate = (
    id: string,
    field: keyof ProjectData,
    value: string,
  ) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const toggleSave = async () => {
    if (isEditMode) {
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSaving(false);
      setIsEditMode(false);
    } else {
      setIsEditMode(true);
    }
  };

  const departments = useMemo(() => {
    const uniqueDepts = new Set(
      projects.map((p) => p.department).filter(Boolean),
    );
    return ["ทั้งหมด", ...Array.from(uniqueDepts).sort()];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Department filter
      if (
        selectedDepartment !== "ทั้งหมด" &&
        project.department !== selectedDepartment
      ) {
        return false;
      }

      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        project.receiptNumber.toLowerCase().includes(query) ||
        project.projectCode.toLowerCase().includes(query) ||
        project.memoTitle.toLowerCase().includes(query) ||
        project.projectHead.toLowerCase().includes(query)
      );
    });
  }, [projects, searchQuery, selectedDepartment]);

  const tableColumns = useMemo(() => {
    const primaryKey = "receiptNumber";
    const primaryCol = ALL_COLUMNS.find((c) => c.key === primaryKey)!;
    const otherCols = ALL_COLUMNS.filter((c) => c.key !== primaryKey);

    if (!isEditMode) {
      return [primaryCol, ...otherCols];
    } else {
      const editableCols = otherCols.filter(
        (c) => EDIT_PERMISSIONS[c.key] === userRole,
      );
      const readonlyCols = otherCols.filter(
        (c) => EDIT_PERMISSIONS[c.key] !== userRole,
      );
      return [primaryCol, ...editableCols, ...readonlyCols];
    }
  }, [isEditMode, userRole]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProjects = filteredProjects.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const DataCell = ({
    project,
    col,
  }: {
    project: ProjectData;
    col: ColumnDef;
  }) => {
    const roleRequired = EDIT_PERMISSIONS[col.key as string];
    const canEdit = isEditMode && roleRequired === userRole;
    const value = project[col.key];

    // ✅ Edit Mode: Input
    if (canEdit) {
      return (
        <Input
          value={value as string}
          onChange={(e) => handleUpdate(project.id, col.key, e.target.value)}
          className={`h-7 text-sm border shadow-sm ${roleRequired ? `border-${ROLE_COLORS[roleRequired].split(" ")[1].replace("border-", "")}` : "border-slate-300"}`}
        />
      );
    }

    // ✅ View Mode: Special case for "memoTitle" (ชื่อบันทึกข้อความ)
    if (col.key === "memoTitle" && value) {
      return (
        <div className="flex items-center justify-between group h-7 gap-2 px-2">
          <span
            className="truncate text-xs text-slate-700 max-w-[180px]"
            title={value as string}
          >
            {value}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            onClick={() =>
              setViewingFullText({
                title: "ชื่อบันทึกข้อความ",
                text: value as string,
              })
            }
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    // ✅ View Mode: Standard
    return (
      <div
        className={`text-xs px-2 py-1 truncate h-7 flex items-center ${!value ? "text-slate-300 italic" : "text-slate-700"} ${col.isNumeric ? "justify-end font-mono" : ""}`}
      >
        {col.key === "docLink" && value ? (
          <a
            href={value as string}
            target="_blank"
            className="text-blue-600 underline hover:text-blue-800 flex items-center gap-1"
          >
            📎 เปิดลิงก์
          </a>
        ) : (
          value || "-"
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <TableIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                ระบบติดตามโครงการ
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredProjects.length} รายการ
                </span>
                {isEditMode && (
                  <span className="text-[10px] text-green-600 flex items-center gap-1 animate-pulse">
                    <ArrowLeftRight className="h-3 w-3" />{" "}
                    จัดเรียงคอลัมน์อัตโนมัติเพื่อการแก้ไข
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 pl-2">
                สิทธิ์:
              </span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="text-xs bg-white border-0 rounded px-2 py-1 cursor-pointer focus:ring-0 text-slate-700 shadow-sm"
              >
                {Object.keys(ROLE_COLORS).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 pl-2">
                หน่วยงาน:
              </span>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs bg-white border-0 rounded px-2 py-1 cursor-pointer focus:ring-0 text-slate-700 shadow-sm max-w-[180px]"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-slate-300 mx-2" />

            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-2 top-2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหา: เลขรับ, รหัส, ชื่อ..."
                className="pl-8 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Edit Button */}
            <Button
              onClick={toggleSave}
              disabled={isSaving}
              className={`h-9 min-w-[110px] shadow-sm transition-all duration-300 ${isEditMode ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-100" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isEditMode ? (
                <Save className="h-4 w-4 mr-2" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
              )}
              {isSaving
                ? "บันทึก..."
                : isEditMode
                  ? "บันทึกข้อมูล"
                  : "แก้ไขข้อมูล"}
            </Button>
          </div>
        </header>

        {/* Table Container */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 relative">
          <Card className="shadow-md border-slate-200 bg-white h-full flex flex-col rounded-lg overflow-hidden">
            <div className="overflow-auto flex-1 relative">
              <table className="w-full border-collapse">
                <thead className="bg-slate-800 text-white sticky top-0 z-20 shadow-md">
                  <tr>
                    {tableColumns.map((col, idx) => {
                      const isPrimary = col.key === "receiptNumber";
                      const isEditable =
                        isEditMode && EDIT_PERMISSIONS[col.key] === userRole;

                      return (
                        <th
                          key={col.key}
                          className={`
                                    p-2 text-[10px] font-medium border-r border-slate-700 uppercase tracking-wider text-left
                                    ${isPrimary ? "sticky left-0 z-30 bg-slate-900 border-r-2 border-slate-500 shadow-[2px_0_5px_rgba(0,0,0,0.3)]" : "bg-slate-800"}
                                    ${isEditable ? "bg-blue-900/50 text-blue-100" : "text-slate-300"}
                                    ${col.width}
                                `}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span>{col.label}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {currentProjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={tableColumns.length}
                        className="p-10 text-center text-slate-400"
                      >
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  ) : (
                    currentProjects.map((project, idx) => (
                      <tr
                        key={project.id}
                        className={`group transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                      >
                        {tableColumns.map((col) => {
                          const isPrimary = col.key === "receiptNumber";
                          const isEditable =
                            isEditMode &&
                            EDIT_PERMISSIONS[col.key] === userRole;

                          return (
                            <td
                              key={col.key}
                              className={`
                                    p-1 border-r border-slate-100 align-middle
                                    ${isPrimary ? "sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r-2 border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]" : ""}
                                    ${isEditable ? "bg-blue-50/30" : ""}
                                `}
                            >
                              <DataCell project={project} col={col} />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center shrink-0 z-20">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>
                  แสดง {startIndex + 1}-
                  {Math.min(startIndex + itemsPerPage, filteredProjects.length)}{" "}
                  จาก {filteredProjects.length}
                </span>
                <div className="h-3 w-px bg-slate-300" />
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-slate-900 rounded-full" />{" "}
                  คือคอลัมน์หลัก
                </span>
                {isEditMode && (
                  <span className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-blue-100 border border-blue-300 rounded-full" />{" "}
                    พื้นที่แก้ไขข้อมูล
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                  disabled={currentPage === 1}
                  className="h-7 text-xs"
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((c) => Math.min(totalPages, c + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-7 text-xs"
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ✅ Full Text Modal Overlay */}
        {viewingFullText && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b p-4 bg-slate-50 rounded-t-lg">
                <h3 className="font-semibold text-slate-800">
                  {viewingFullText.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-slate-200"
                  onClick={() => setViewingFullText(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {viewingFullText.text}
                </p>
              </div>
              <div className="p-4 border-t bg-slate-50 rounded-b-lg flex justify-end">
                <Button onClick={() => setViewingFullText(null)}>
                  ปิดหน้าต่าง
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
