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
  X,
  Search,
  Unlock,
  Eye,
  FileEdit,
  FileText,
  Plus,
} from "lucide-react";

// --- 1. Data Interface ---
interface ProjectData {
  id: string;
  projectCode: string; // 1. รหัสโครงการ
  memoTitle: string; // 2. ชื่อโครงการ
  department: string; // 3. ภาควิชา
  purpose: string; // 4. เพื่อดำเนินการ

  // Meeting data (source for Column 5)
  boardMeetingNo: string;
  boardMeetingDate: string;
  deanDecisionNo: string;
  deanDecisionDate: string;

  totalBudget: string; // 6. งบประมาณรวม
  compensation: string; // 7. หมวดค่าตอบแทน
  operatingCost: string; // 8. หมวดค่าใช้สอย

  maintenanceFeeProposal: string; // 9. ค่าบำรุงสถานที่ (เสนอ) - Read Only
  // 10. ค่าบำรุงสถานที่ (จริง) -> uses _maintenanceFee in Enhanced

  materialCost: string; // 11. หมวดค่าวัสดุ
  utilities: string; // 12. หมวดสาธารณูปโภค

  electricityFeeProposal: string; // 13. ค่าไฟฟ้า (เสนอ) - Read Only
  // 14. ค่าไฟฟ้า (จริง) -> uses _electricityFeeActual in Enhanced

  academicFund: string; // 15. หมวดเงินอุดหนุน
  generalReserve: string; // 16. หมวดเงินสำรอง

  vendorCode: string; // 17. รหัสเจ้าหนี้
  // 18. ศูนย์ต้นทุน -> uses _costCenter in Enhanced

  // Other fields
  receiptNumber: string;
  projectHead: string;
  startDate: string;
  endDate: string;
  fundOwner: string;
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

// --- Project Status Constants ---
const PROJECT_STATUSES = [
  "DRAFT. แบบร่างโครงการ",
  "1. งานบริหารวิจัยและบริการวิชาการ รอดำเนินการตรวจสอบ/แก้ไข",
  "2. งานบริหารวิจัยและบริการวิชาการ ตรวจสอบ/แก้ไข เรียบร้อยแล้ว",
  "3. งานบริหารวิจัยและบริการวิชาการเสนอเข้าที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์",
  "4. มติที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์อนุมัติ และให้เสนองานบริหารวิจัยและบริการวิชาการเพื่อดำเนินการต่อไป",
  "5. มติที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์เห็นชอบ และให้เสนอกลุ่มภารกิจการประชุม ศูนย์บริหารกลางเพื่อดำเนินการต่อไป",
  "6. เสนอคณบดี เพื่อพิจารณาอนุมัติโครงการ",
  "7. เสนอต่อที่ประชุมคณบดีแก่คณะวิทยาศาสตร์ เพื่อพิจารณาทักท้วง",
  "8. คณบดีอนุมัติโครงการ",
  "9. มติคณบดีอนุมัติและเสนอคณะวิทยาศาสตร์",
  "10. อนุมัติโครงการ",
  "13. ปิดโครงการ",
  "RECALL. ดึงกลับเอกสาร",
] as const;

const STATUS_TRANSITION_FLOW: Record<string, string[]> = {
  DRAFT: ["1"],
  "1": ["2", "RECALL"],
  RECALL: ["1"],
  "2": ["1", "3"],
  "3": ["4", "5"],
  "4": ["6"],
  "5": ["7"],
  "6": ["8"],
  "7": ["9"],
  "8": ["10"],
  "9": ["10"],
  "10": ["13"],
  "13": [],
};

const getStatusKey = (statusValue: string | undefined) => {
  if (!statusValue) return "";
  if (statusValue === "DRAFT" || statusValue.startsWith("DRAFT")) {
    return "DRAFT";
  }
  return statusValue.split(".")[0].trim();
};

const getAllowedNextStatusKeys = (currentStatusValue: string | undefined) => {
  const currentKey = getStatusKey(currentStatusValue);
  return STATUS_TRANSITION_FLOW[currentKey] ?? [];
};

// --- Meeting Record Interface ---
interface MeetingRecord {
  id: string;
  type: "BOARD" | "DEAN";
  no: string;
  date: string;
  purpose?: string; // เพื่อดำเนินการ
}

// --- 2. Enhanced Interface ---
interface EnhancedProjectData extends ProjectData {
  _projectStatus?: string;
  _meetings: MeetingRecord[];
  _costCenter?: string; // 18.
  _maintenanceFee?: string; // 10.
  _electricityFeeActual?: string; // 14.
  _canMoveTo11?: boolean;
  _canCloseProject?: boolean;
  _researchComplete?: boolean;
  _physicalComplete?: boolean;
  _draftState?: "DRAFT" | "SUBMITTED";
}

type UserRole = "ภาควิชา" | "งานวิจัย" | "งานแผน" | "งานคลัง" | "กายภาพ";

// --- Permissions Configuration ---
const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  _projectStatus: ["งานวิจัย", "กายภาพ"],
  _meetings: ["งานวิจัย", "งานแผน"],
  vendorCode: ["งานคลัง"],
  _costCenter: ["งานแผน"],
  _maintenanceFee: ["กายภาพ"],
  _electricityFeeActual: ["กายภาพ"],
};

// --- Column Definitions ---
// Ordered exactly as requested
const COLUMNS = [
  { key: "projectCode", label: "รหัสโครงการ", width: "min-w-[120px]" },
  {
    key: "_projectStatus",
    label: "สถานะโครงการ",
    width: "min-w-[250px]",
    editable: true,
    wrap: true,
  },
  {
    key: "memoTitle",
    label: "ชื่อโครงการ",
    width: "min-w-[200px]",
    wrap: true,
  },
  {
    key: "department",
    label: "ภาควิชา/หน่วยงาน",
    width: "min-w-[140px]",
    wrap: true,
  },
  {
    key: "purpose",
    label: "เพื่อดำเนินการ",
    width: "min-w-[150px]",
    wrap: true,
  },
  {
    key: "boardMeetingNo",
    label: "ตามมติที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์ ครั้งที่",
    width: "min-w-[180px]",
    wrap: true,
  },
  { key: "boardMeetingDate", label: "วันที่", width: "min-w-[120px]" },
  {
    key: "deanDecisionNo",
    label: "ตามมติที่ประชุมคณบดี ครั้งที่",
    width: "min-w-[180px]",
    wrap: true,
  },
  { key: "deanDecisionDate", label: "วันที่", width: "min-w-[120px]" },
  {
    key: "totalBudget",
    label: "งบประมาณรวม",
    width: "min-w-[120px]",
    align: "right",
  },
  {
    key: "compensation",
    label: "หมวดค่าตอบแทน",
    width: "min-w-[120px]",
    align: "right",
  },
  {
    key: "operatingCost",
    label: "หมวดค่าใช้สอย",
    width: "min-w-[120px]",
    align: "right",
  },
  {
    key: "maintenanceFeeProposal",
    label: "ค่าบำรุงสถานที่ (แบบข้อเสนอโครงการ)",
    width: "min-w-[140px]",
    align: "right",
    bg: "bg-slate-50",
    wrap: true,
  },
  {
    key: "_maintenanceFee",
    label: "ค่าบำรุงสถานที่ (กายภาพ) = ใช้จริง",
    width: "min-w-[140px]",
    align: "right",
    editable: true,
    wrap: true,
  },
  {
    key: "materialCost",
    label: "หมวดค่าวัสดุ",
    width: "min-w-[120px]",
    align: "right",
  },
  {
    key: "utilities",
    label: "หมวดสาธารณูปโภค",
    width: "min-w-[120px]",
    align: "right",
  },
  {
    key: "electricityFeeProposal",
    label: "ค่าไฟฟ้า (แบบข้อเสนอโครงการ)",
    width: "min-w-[140px]",
    align: "right",
    bg: "bg-slate-50",
    wrap: true,
  },
  {
    key: "_electricityFeeActual",
    label: "ค่าไฟฟ้า (กายภาพ) = ใช้จริง",
    width: "min-w-[140px]",
    align: "right",
    editable: true,
    wrap: true,
  },
  {
    key: "academicFund",
    label: "หมวดเงินอุดหนุน",
    width: "min-w-[120px]",
    align: "right",
  },
  {
    key: "generalReserve",
    label: "หมวดเงินสำรอง",
    width: "min-w-[120px]",
    align: "right",
  },
  {
    key: "vendorCode",
    label: "รหัสเจ้าหนี้",
    width: "min-w-[120px]",
    editable: true,
  },
  {
    key: "_costCenter",
    label: "ศูนย์ต้นทุน",
    width: "min-w-[120px]",
    editable: true,
  },
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
  const [savingCompletionProjectId, setSavingCompletionProjectId] = useState<
    string | null
  >(null);

  // Modal for meetings management
  const [editingMeetings, setEditingMeetings] = useState<{
    projectId: string;
    list: MeetingRecord[];
  } | null>(null);

  // --- Load & Transform ---
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/overviews");

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();

        if (data.success && data.data.projects) {
          setProjects(data.data.projects);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Failed to load project data:", error);
        alert("ไม่สามารถโหลดข้อมูลโครงการได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  // --- Handlers ---
  const handleUpdateField = (
    id: string,
    field: keyof EnhancedProjectData,
    value: string,
  ) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  // Start editing a cell
  const handleStartEdit = (
    projectId: string,
    field: string,
    currentValue: string,
  ) => {
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
      const response = await fetch(
        `/api/overviews/${editingCell.projectId}/field`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            field: editingCell.field,
            value: editingValue,
            actorRole: userRole,
            actorUserId: `mock-${userRole}`,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update field");
      }

      // Update local state optimistically
      handleUpdateField(
        editingCell.projectId,
        editingCell.field as keyof EnhancedProjectData,
        editingValue,
      );

      setEditingCell(null);
      setEditingValue("");
    } catch (error) {
      console.error("Error saving cell:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingCell(null);
    }
  };

  const handleToggleCompletion = async (
    project: EnhancedProjectData,
    role: "RESEARCH" | "PHYSICAL",
    isComplete: boolean,
  ) => {
    setSavingCompletionProjectId(project.id);
    try {
      const response = await fetch(`/api/overviews/${project.id}/completion`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          isComplete,
          actorRole: userRole,
          actorUserId: `mock-${userRole}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error ?? "Failed to update completion");
      }

      setProjects((prev) =>
        prev.map((item) => {
          if (item.id !== project.id) return item;
          const nextResearch =
            role === "RESEARCH" ? isComplete : !!item._researchComplete;
          const nextPhysical =
            role === "PHYSICAL" ? isComplete : !!item._physicalComplete;
          return {
            ...item,
            _researchComplete: nextResearch,
            _physicalComplete: nextPhysical,
            _canCloseProject: nextResearch && nextPhysical,
          };
        }),
      );
    } catch (error) {
      console.error("Error saving completion:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกความครบถ้วนข้อมูล");
    } finally {
      setSavingCompletionProjectId(null);
    }
  };

  const hasPermission = (fieldKey: string) => {
    const allowedRoles = ROLE_PERMISSIONS[fieldKey];
    return allowedRoles && allowedRoles.includes(userRole);
  };

  const isColumnEditable = (col: (typeof COLUMNS)[0]) => {
    return col.editable && hasPermission(col.key);
  };

  // Save meetings modal
  const handleSaveMeetings = async () => {
    if (editingMeetings) {
      const errors: string[] = [];
      editingMeetings.list.forEach((m, idx) => {
        if (!m.no || m.no.trim() === "")
          errors.push(`มติที่ ${idx + 1}: กรุณาระบุครั้งที่`);
        if (!m.date || m.date.trim() === "")
          errors.push(`มติที่ ${idx + 1}: กรุณาระบุวันที่`);
      });

      if (errors.length > 0) {
        alert("กรุณาตรวจสอบข้อมูล:\n" + errors.join("\n"));
        return;
      }

      try {
        const response = await fetch(
          `/api/overviews/${editingMeetings.projectId}/meetings`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              meetings: editingMeetings.list,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to update meetings");
        }

        // Update local state optimistically
        setProjects((prev) =>
          prev.map((p) =>
            p.id === editingMeetings.projectId
              ? { ...p, _meetings: editingMeetings.list }
              : p,
          ),
        );

        setEditingMeetings(null);
      } catch (error) {
        console.error("Error saving meetings:", error);
        alert(
          "เกิดข้อผิดพลาดในการบันทึกข้อมูลมติที่ประชุม กรุณาลองใหม่อีกครั้ง",
        );
      }
    }
  };

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !query ||
        p.projectCode.toLowerCase().includes(query) ||
        p.memoTitle.toLowerCase().includes(query) ||
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

  // Helper to render cell content based on column definition
  const renderCell = (
    project: EnhancedProjectData,
    col: (typeof COLUMNS)[0],
  ) => {
    const value = project[col.key as keyof EnhancedProjectData];
    const isEditable = col.editable && hasPermission(col.key);
    const isEditing =
      editingCell?.projectId === project.id && editingCell?.field === col.key;
    const alignClass = col.align === "right" ? "text-right" : "text-left";
    const fontClass = col.align === "right" ? "font-mono" : "font-normal";

    // 1. Special Case: Project Code (Link)
    if (col.key === "projectCode") {
      return (
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-semibold text-indigo-900 hover:text-indigo-600 hover:underline"
        >
          {(value as string) || "-"}
        </Link>
      );
    }

    // 2. Special Case: Purpose Column (Display from latest meeting)
    if (col.key === "purpose") {
      const canEditAny = hasPermission("_meetings");
      const latestMeeting =
        project._meetings.length > 0
          ? project._meetings[project._meetings.length - 1]
          : null;
      const purposeValue = latestMeeting?.purpose || "-";

      return (
        <div className="flex items-start justify-between group">
          <div className="text-sm text-slate-700 flex-1 leading-relaxed">
            {purposeValue}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 mt-0.5"
            onClick={() =>
              setEditingMeetings({
                projectId: project.id,
                list: [...project._meetings],
              })
            }
          >
            {canEditAny ? (
              <FileEdit size={12} className="text-indigo-600" />
            ) : (
              <Eye size={12} className="text-slate-400" />
            )}
          </Button>
        </div>
      );
    }

    // 2b. Special Case: Meeting Columns (Combined Edit Card)
    if (
      [
        "boardMeetingNo",
        "boardMeetingDate",
        "deanDecisionNo",
        "deanDecisionDate",
      ].includes(col.key)
    ) {
      const canEditAny = hasPermission("_meetings");

      return (
        <div className="flex items-start justify-between group">
          <div className="text-sm text-slate-700 flex-1 leading-relaxed">
            {(value as string) || "-"}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 mt-0.5"
            onClick={() =>
              setEditingMeetings({
                projectId: project.id,
                list: [...project._meetings],
              })
            }
          >
            {canEditAny ? (
              <FileEdit size={12} className="text-indigo-600" />
            ) : (
              <Eye size={12} className="text-slate-400" />
            )}
          </Button>
        </div>
      );
    }

    // 3. Special Case: Project Status (Dropdown)
    if (col.key === "_projectStatus") {
      if (isEditing) {
        const allowedNextKeys = getAllowedNextStatusKeys(
          project._projectStatus,
        );
        const currentStatusKey = getStatusKey(project._projectStatus);

        return (
          <div className="flex gap-1 items-center z-50 relative">
            <select
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="h-8 text-sm border rounded px-2 w-full"
              autoFocus
            >
              <option value="">-- เลือกสถานะ --</option>
              {PROJECT_STATUSES.map((status) => (
                <option
                  key={status}
                  value={status}
                  disabled={(() => {
                    const statusKey = getStatusKey(status);
                    if (statusKey === currentStatusKey) return false;
                    if (!allowedNextKeys.includes(statusKey)) return true;

                    const isClosingTransition =
                      currentStatusKey === "10" && statusKey === "13";
                    if (
                      isClosingTransition &&
                      userRole !== "งานวิจัย" &&
                      userRole !== "กายภาพ"
                    ) {
                      return true;
                    }

                    if (
                      !isClosingTransition &&
                      userRole !== "งานวิจัย"
                    ) {
                      return true;
                    }

                    if (
                      currentStatusKey === "10" &&
                      statusKey === "13" &&
                      !project._canCloseProject
                    ) {
                      return true;
                    }

                    return false;
                  })()}
                >
                  {status}
                </option>
              ))}
            </select>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-600 hover:bg-green-50 shrink-0"
              onClick={handleSaveCell}
              disabled={savingCell === `${project.id}-${col.key}`}
            >
              {savingCell === `${project.id}-${col.key}` ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400 hover:bg-slate-50 shrink-0"
              onClick={handleCancelEdit}
            >
              <X size={14} />
            </Button>
          </div>
        );
      }

      // Display mode for status
      const statusNumber = getStatusKey(value as string);
      const statusColor =
        statusNumber === "13" ? "text-green-700" : "text-slate-700";
      const isStatus10 = statusNumber === "10";
      const canManageResearch = userRole === "งานวิจัย";
      const canManagePhysical = userRole === "กายภาพ";

      return (
        <div className={`flex items-start justify-between group ${alignClass}`}>
          <div className="flex-1">
            <div
              className={`text-sm ${statusColor} leading-relaxed`}
              title={value as string}
            >
              {(value as string) || "-"}
            </div>

            {isStatus10 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${project._researchComplete ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  งานวิจัย {project._researchComplete ? "ครบ" : "ยังไม่ครบ"}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${project._physicalComplete ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  กายภาพ {project._physicalComplete ? "ครบ" : "ยังไม่ครบ"}
                </span>

                {canManageResearch && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px]"
                    onClick={() =>
                      handleToggleCompletion(
                        project,
                        "RESEARCH",
                        !project._researchComplete,
                      )
                    }
                    disabled={savingCompletionProjectId === project.id}
                  >
                    {project._researchComplete ? "ยกเลิกครบ" : "ยืนยันครบ"}
                  </Button>
                )}

                {canManagePhysical && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px]"
                    onClick={() =>
                      handleToggleCompletion(
                        project,
                        "PHYSICAL",
                        !project._physicalComplete,
                      )
                    }
                    disabled={savingCompletionProjectId === project.id}
                  >
                    {project._physicalComplete ? "ยกเลิกครบ" : "ยืนยันครบ"}
                  </Button>
                )}
              </div>
            )}
          </div>
          {isEditable && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 mt-0.5"
              onClick={() =>
                handleStartEdit(project.id, col.key, value as string)
              }
            >
              <Pencil size={12} className="text-indigo-600" />
            </Button>
          )}
        </div>
      );
    }

    // 4. Editing Mode
    if (isEditing) {
      return (
        <div className="flex gap-1 items-center z-50 relative">
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveCell();
              if (e.key === "Escape") handleCancelEdit();
            }}
            className={`h-8 text-sm ${alignClass} min-w-[80px]`}
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-green-600 hover:bg-green-50 shrink-0"
            onClick={handleSaveCell}
            disabled={savingCell === `${project.id}-${col.key}`}
          >
            {savingCell === `${project.id}-${col.key}` ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-400 hover:bg-slate-50 shrink-0"
            onClick={handleCancelEdit}
          >
            <X size={14} />
          </Button>
        </div>
      );
    }

    // 5. Standard Display (Editable or Read-only)
    const shouldWrap = col.wrap;

    return (
      <div className={`flex items-start justify-between group ${alignClass}`}>
        <div
          className={`text-sm text-slate-700 ${fontClass} flex-1 ${shouldWrap ? "leading-relaxed" : "truncate"}`}
          title={value as string}
        >
          {(value as string) || "-"}
        </div>
        {isEditable && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 mt-0.5"
            onClick={() =>
              handleStartEdit(project.id, col.key, value as string)
            }
          >
            <Pencil size={12} className="text-indigo-600" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-[family-name:var(--font-sarabun)]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0 z-20 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
              <TableIcon size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                ระบบติดตามโครงการ
              </h1>
              <p className="text-xs text-slate-500">
                จัดการโดย:{" "}
                <span className="font-bold text-indigo-600">{userRole}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={16}
              />
              <Input
                type="text"
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-64 text-sm"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-sm bg-slate-100 border-slate-200 rounded px-3 py-1.5 focus:ring-indigo-500"
            >
              <option value="all">ทุกภาควิชา</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="text-sm bg-slate-100 border-slate-200 rounded px-3 py-1.5 focus:ring-indigo-500"
            >
              <option value="ภาควิชา">ภาควิชา (View)</option>
              <option value="งานวิจัย">งานวิจัย (Edit Proj)</option>
              <option value="งานแผน">งานแผน (Cost)</option>
              <option value="งานคลัง">งานคลัง (Vendor)</option>
              <option value="กายภาพ">กายภาพ (Utils)</option>
            </select>
          </div>
        </header>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-slate-100/50 p-4">
          <Card className="border-none shadow-lg overflow-hidden h-full flex flex-col bg-white rounded-lg">
            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-800 text-slate-200 sticky top-0 z-10 text-xs uppercase shadow-sm">
                  <tr>
                    {COLUMNS.map((col) => {
                      const canEdit = isColumnEditable(col);
                      const isDetailsColumn = [
                        "purpose",
                        "boardMeetingNo",
                        "boardMeetingDate",
                        "deanDecisionNo",
                        "deanDecisionDate",
                      ].includes(col.key);
                      const canEditDetails =
                        isDetailsColumn && hasPermission("_meetings");

                      return (
                        <th
                          key={col.key}
                          className={`p-3 font-semibold border-r border-slate-700/50 last:border-0 ${col.width} ${
                            col.wrap ? "whitespace-normal" : "whitespace-nowrap"
                          } transition-colors`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="leading-tight">{col.label}</span>
                            {(canEdit || canEditDetails) && (
                              <Unlock
                                size={12}
                                className="text-green-300 animate-pulse shrink-0"
                              />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={COLUMNS.length}
                        className="p-10 text-center text-slate-400"
                      >
                        กำลังโหลด...
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
                      <tr key={project.id} className="group hover:bg-slate-50">
                        {COLUMNS.map((col) => {
                          const canEdit = isColumnEditable(col);
                          const isDetailsColumn = [
                            "purpose",
                            "boardMeetingNo",
                            "boardMeetingDate",
                            "deanDecisionNo",
                            "deanDecisionDate",
                          ].includes(col.key);
                          const canEditDetails =
                            isDetailsColumn && hasPermission("_meetings");

                          return (
                            <td
                              key={col.key}
                              className={`p-3 align-top border-r border-slate-100 last:border-0 transition-colors ${
                                col.bg || ""
                              } ${
                                canEdit || canEditDetails
                                  ? "bg-slate-100 hover:bg-slate-200"
                                  : ""
                              } ${
                                col.wrap
                                  ? "whitespace-normal"
                                  : "whitespace-nowrap"
                              }`}
                            >
                              {renderCell(project, col)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* --- MODAL: Meetings Management --- */}
        {editingMeetings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-4xl bg-white shadow-2xl rounded-xl flex flex-col max-h-[85vh] md:max-h-[80vh] animate-in zoom-in-95 duration-200">
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
                  <div className="space-y-0">
                    {/* Meeting Cards */}
                    {editingMeetings.list.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="py-2 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-semibold text-slate-700 min-w-[24px] pt-2">
                            {idx + 1}.
                          </span>

                          <div className="flex-1 min-w-[320px] max-w-[400px]">
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
                              className="w-full text-sm border border-slate-300 rounded focus:ring-indigo-500 px-3 py-2 h-auto whitespace-normal"
                            >
                              <option value="BOARD">
                                มติที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์
                              </option>
                              <option value="DEAN">มติที่ประชุมคณบดี</option>
                            </select>
                          </div>

                          <div className="w-[110px]">
                            <Input
                              placeholder="เช่น 17/2568"
                              value={m.no}
                              onChange={(e) => {
                                const newList = [...editingMeetings.list];
                                newList[idx].no = e.target.value;
                                setEditingMeetings({
                                  ...editingMeetings,
                                  list: newList,
                                });
                              }}
                              className="text-sm"
                            />
                          </div>

                          <div className="w-[140px]">
                            <Input
                              type="date"
                              value={m.date}
                              onChange={(e) => {
                                const newList = [...editingMeetings.list];
                                newList[idx].date = e.target.value;
                                setEditingMeetings({
                                  ...editingMeetings,
                                  list: newList,
                                });
                              }}
                              className="text-sm"
                            />
                          </div>

                          <div className="flex-1 min-w-[200px]">
                            <Input
                              placeholder="เพื่อดำเนินการ..."
                              value={m.purpose || ""}
                              onChange={(e) => {
                                const newList = [...editingMeetings.list];
                                newList[idx].purpose = e.target.value;
                                setEditingMeetings({
                                  ...editingMeetings,
                                  list: newList,
                                });
                              }}
                              className="text-sm"
                            />
                          </div>

                          <Button
                            type="button"
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
                            className="h-10 w-10 text-white bg-red-600 hover:bg-red-700 rounded-lg flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
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
                          purpose: "",
                        };
                        setEditingMeetings({
                          ...editingMeetings,
                          list: [...editingMeetings.list, newItem],
                        });
                      }}
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่มมติ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {editingMeetings.list.length > 0 ? (
                      <>
                        {editingMeetings.list.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="py-2 border-b border-slate-100 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-sm font-semibold text-slate-700 min-w-[24px] pt-2">
                                {idx + 1}.
                              </span>

                              <div className="flex-1 min-w-[320px] max-w-[400px]">
                                <div className="text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded bg-slate-50 break-words">
                                  {m.type === "BOARD"
                                    ? "มติที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์"
                                    : "มติที่ประชุมคณบดี"}
                                </div>
                              </div>

                              <div className="w-[110px]">
                                <div className="text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded bg-slate-50">
                                  {m.no || "-"}
                                </div>
                              </div>

                              <div className="w-[140px]">
                                <div className="text-sm text-slate-600 px-3 py-2 border border-slate-200 rounded bg-slate-50">
                                  {m.date || "-"}
                                </div>
                              </div>

                              <div className="flex-1 min-w-[200px]">
                                <div className="text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded bg-slate-50 break-words">
                                  {m.purpose || "-"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
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
