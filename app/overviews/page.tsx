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
  CheckCircle2,
  RefreshCw,
  FlaskConical,
  AlertCircle,
  Upload,
  Download,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { mockActorByRole, mockActors, type ActorRole } from "@/lib/mock-actors";

// --- 1. Data Interface ---
interface ProjectData {
  id: string;
  createdAt?: string;
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

const getStatusKey = (statusValue: string | undefined) => {
  if (!statusValue) return "";
  if (statusValue === "DRAFT" || statusValue.startsWith("DRAFT")) {
    return "DRAFT";
  }
  return statusValue.split(".")[0].trim();
};

// --- Meeting Record Interface ---
interface MeetingRecord {
  id: string;
  type: "BOARD" | "DEAN";
  no: string;
  date: string;
  purpose?: string; // เพื่อดำเนินการ
}

interface MeetingSummaryRecord {
  id: string;
  no: string;
  date: string;
  purpose?: string;
  approvalLink?: string;
}

// --- 2. Enhanced Interface ---
interface EnhancedProjectData extends ProjectData {
  _projectStatus?: string;
  _currentStatusCode?: string;
  _meetings: MeetingRecord[];
  _costCenter?: string; // 18.
  _costCenterFileName?: string;
  _costCenterFileType?: string;
  _costCenterUploadedAt?: string;
  _costCenterDownloadUrl?: string;
  _maintenanceFee?: string; // 10.
  _electricityFeeActual?: string; // 14.
  _researchComplete?: boolean;
  _physicalComplete?: boolean;
  _closureCompleteFinance?: boolean;
  _canReleaseProject?: boolean;
  _canCloseProject?: boolean;
  _releaseChecklist?: {
    hasProjectCode: boolean;
    hasVendor: boolean;
    hasCostCenter: boolean;
    hasDeanApproval: boolean;
  };
  _statusGroup?:
    | "DRAFT"
    | "DEPT_HEAD"
    | "RESEARCH_REVIEW"
    | "WAITING_MEETING"
    | "WAITING_UNIT_DATA"
    | "ACTIVE"
    | "CLOSED"
    | "OTHER";
  _routeType?: "BOARD" | "DEAN" | "NONE";
  _nextWorkLabel?: string;
  _needsActionBy?: UserRole[];
  _rolePriority?: Partial<Record<UserRole, number>>;
  _meetingSummary?: {
    board: MeetingSummaryRecord | null;
    dean: MeetingSummaryRecord | null;
  };
  _activeBudgetRevision?: {
    id: string;
    status: BudgetRevisionStatus;
    reason: string;
    closeAfterApproval: boolean;
    meetingNo?: string | null;
    meetingDate?: string | null;
    meetingNote?: string | null;
    approvalRoute?: "BOARD" | "DEAN" | null;
    affectsCostCenter: boolean;
    affectsVendor: boolean;
    deanApprovalFileUrl?: string | null;
  } | null;
  _internalReviewChecked?: boolean;
  _latestInternalReviewAction?: {
    actorRole: string;
    actorName: string | null;
    createdAt: string;
  } | null;
  _departmentHeadUserId?: string;
  _departmentHeadName?: string;
  _draftState?: "DRAFT" | "SUBMITTED";
}

type UserRole = ActorRole;
type StatusAction =
  | "SUBMIT_DRAFT"
  | "DEPT_APPROVE"
  | "MARK_INTERNAL_REVIEW_CHECKED"
  | "COMPLETE_RESEARCH_REVIEW"
  | "RETURN_FOR_REVISION"
  | "APPROVE_TO_BOARD"
  | "BOARD_APPROVE_TO_WAITING_RELEASE"
  | "DEAN_APPROVE_TO_WAITING_RELEASE"
  | "RELEASE_BOARD_PROJECT"
  | "RELEASE_DEAN_PROJECT"
  | "CLOSE_PROJECT"
  | "RESUME_RECALL";

type BudgetRevisionStatus =
  | "BR_DRAFT"
  | "BR_SUBMITTED"
  | "BR_RESEARCH_CHECKED"
  | "BR_WAITING_MEETING"
  | "BR_BOARD_APPROVED"
  | "BR_DEAN_APPROVED"
  | "BR_APPLIED"
  | "BR_REJECTED"
  | "BR_CANCELLED";

type BudgetRevisionAction =
  | "RESEARCH_CHECK"
  | "RETURN_TO_OWNER"
  | "REJECT"
  | "APPROVE_TO_MEETING"
  | "MARK_BOARD_APPROVED"
  | "MARK_DEAN_APPROVED"
  | "APPLY"
  | "CANCEL";

// --- Permissions Configuration ---
const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  _meetings: ["งานวิจัย"],
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
    width: "min-w-[310px]",
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
    label: "มติ/ข้อสั่งการ",
    width: "min-w-[150px]",
    wrap: true,
  },
  {
    key: "boardMeetingNo",
    label: "มติคณะกรรมการบริหารคณะวิทยาศาสตร์ ครั้งที่",
    width: "min-w-[180px]",
    wrap: true,
  },
  { key: "boardMeetingDate", label: "วันที่", width: "min-w-[120px]" },
  {
    key: "deanDecisionNo",
    label: "มติคณบดี ครั้งที่",
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
    label: "ค่าบำรุงสถานที่ใช้จริงจากทีมกายภาพ",
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
    label: "ค่าไฟฟ้าใช้จริงจากทีมกายภาพ",
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

type StatusFilter =
  | "all"
  | "DEPT_HEAD"
  | "RESEARCH_REVIEW"
  | "WAITING_MEETING"
  | "WAITING_UNIT_DATA"
  | "ACTIVE"
  | "BUDGET_REVISION"
  | "CLOSED";

type MyWorkFilter = "all" | "needsMe" | "editableByMe" | "budgetRevision";
type SortOption =
  | "rolePriority"
  | "status"
  | "createdAt"
  | "budgetDesc"
  | "projectName";

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "DEPT_HEAD", label: "รอหัวหน้าภาค" },
  { value: "RESEARCH_REVIEW", label: "ฝ่ายวิจัยตรวจสอบ" },
  { value: "WAITING_MEETING", label: "รอมติที่ประชุม" },
  { value: "WAITING_UNIT_DATA", label: "ผ่านมติ รอข้อมูลประกอบ" },
  { value: "ACTIVE", label: "อนุมัติให้ดำเนินโครงการ" },
  { value: "BUDGET_REVISION", label: "คำขอแก้ไขงบประมาณ" },
  { value: "CLOSED", label: "ปิดโครงการ" },
];

const MY_WORK_FILTER_OPTIONS: Array<{ value: MyWorkFilter; label: string }> = [
  { value: "all", label: "ทุกงาน" },
  { value: "needsMe", label: "รอดำเนินการโดยฉัน" },
  { value: "editableByMe", label: "ข้อมูลที่แก้ไขได้" },
  { value: "budgetRevision", label: "แก้ไขงบประมาณ" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "rolePriority", label: "งานค้างตามบทบาท" },
  { value: "status", label: "สถานะโครงการ" },
  { value: "createdAt", label: "สร้างล่าสุด" },
  { value: "budgetDesc", label: "งบประมาณมากไปน้อย" },
  { value: "projectName", label: "ชื่อโครงการ" },
];

const ROLE_DISPLAY_LABELS: Record<UserRole, string> = {
  USER: "เจ้าของโครงการ",
  ภาควิชาวิทยาศาสตร์: "หัวหน้าภาควิชา",
  งานวิจัย: "ฝ่ายวิจัย",
  หัวหน้าฝ่ายวิจัย: "หัวหน้าฝ่ายวิจัย",
  งานแผน: "งานแผน",
  งานคลัง: "งานคลัง",
  กายภาพ: "งานกายภาพ",
};

const formatActorName = (name: string) => name.replace(" (Mock)", "");

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "แบบร่างโครงการ",
  RECALL: "ดึงกลับเอกสาร",
  STATUS_0: "รอหัวหน้าภาควิชาอนุมัติ",
  STATUS_1: "ฝ่ายวิจัยตรวจสอบ/แก้ไข",
  STATUS_2: "ฝ่ายวิจัยตรวจสอบแล้ว",
  STATUS_3: "รอมติที่ประชุม",
  STATUS_4: "ผ่านมติคณะกรรมการฯ รอข้อมูลประกอบ",
  STATUS_5: "ผ่านมติคณบดี รอข้อมูลประกอบ",
  STATUS_6: "อนุมัติให้ดำเนินโครงการ",
  STATUS_7: "อนุมัติให้ดำเนินโครงการ",
  STATUS_13: "ปิดโครงการ",
};

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0,
  RECALL: 0,
  STATUS_0: 1,
  STATUS_1: 2,
  STATUS_2: 3,
  STATUS_3: 4,
  STATUS_4: 5,
  STATUS_5: 6,
  STATUS_6: 7,
  STATUS_7: 8,
  STATUS_13: 9,
};

const displayStatusFromCode = (statusCode: string | undefined) => {
  if (!statusCode) return "";
  const label = STATUS_LABELS[statusCode] ?? statusCode;
  if (statusCode === "DRAFT" || statusCode === "RECALL") {
    return `${statusCode}. ${label}`;
  }
  return `${statusCode.replace("STATUS_", "")}. ${label}`;
};

const formatMeetingDate = (dateValue: string | undefined) => {
  if (!dateValue) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));
};

const getRouteBadgeLabel = (project: EnhancedProjectData) => {
  if (project._routeType === "BOARD") return "มติคณะกรรมการฯ";
  if (project._routeType === "DEAN") return "มติคณบดี";
  return "";
};

const getStatusBadgeClass = (statusKey: string) => {
  if (statusKey === "DRAFT" || statusKey === "RECALL") {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  if (statusKey === "0") return "bg-amber-100 text-amber-800 border-amber-200";
  if (statusKey === "1")
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (statusKey === "2" || statusKey === "3") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (statusKey === "4" || statusKey === "5") {
    return "bg-violet-100 text-violet-800 border-violet-200";
  }
  if (statusKey === "6" || statusKey === "7") {
    return "bg-green-100 text-green-800 border-green-200";
  }
  if (statusKey === "13")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const canRoleEditProject = (project: EnhancedProjectData, role: UserRole) => {
  const statusKey = getStatusKey(project._projectStatus);
  if (role === "งานแผน") {
    return ["4", "5", "6", "7"].includes(statusKey);
  }
  if (role === "งานคลัง") {
    return ["4", "5", "6", "7"].includes(statusKey);
  }
  if (role === "กายภาพ") {
    return ["6", "7"].includes(statusKey);
  }
  if (role === "งานวิจัย") {
    return ["1", "2", "3", "4", "5", "6", "7", "RECALL"].includes(statusKey);
  }
  if (role === "หัวหน้าฝ่ายวิจัย") return statusKey === "2";
  if (role === "USER") return ["DRAFT", "RECALL", "6", "7"].includes(statusKey);
  return statusKey === "0";
};

const recalcReleaseState = (
  project: EnhancedProjectData,
): EnhancedProjectData => {
  const statusKey = getStatusKey(project._projectStatus);
  const isDeanRoute = statusKey === "5" || statusKey === "7";
  const hasCostCenter =
    Boolean(project._costCenter?.trim()) ||
    Boolean(project._costCenterFileName?.trim());
  const releaseChecklist = project._releaseChecklist
    ? {
        ...project._releaseChecklist,
        hasVendor: Boolean(project.vendorCode?.trim()),
        hasCostCenter,
        hasDeanApproval: !isDeanRoute || Boolean(project.docLink?.trim()),
      }
    : project._releaseChecklist;
  return {
    ...project,
    _releaseChecklist: releaseChecklist,
    _canReleaseProject: releaseChecklist
      ? releaseChecklist.hasProjectCode &&
        releaseChecklist.hasVendor &&
        releaseChecklist.hasCostCenter &&
        releaseChecklist.hasDeanApproval
      : project._canReleaseProject,
  };
};

const createMockProjects = (): EnhancedProjectData[] => {
  const base = {
    receiptNumber: "",
    memoTitle: "โครงการตัวอย่าง",
    department: "ภาควิชาวิทยาศาสตร์",
    purpose: "-",
    boardMeetingNo: "",
    boardMeetingDate: "",
    deanDecisionNo: "",
    deanDecisionDate: "",
    totalBudget: "120000.00",
    compensation: "40000.00",
    operatingCost: "30000.00",
    maintenanceFeeProposal: "5000.00",
    materialCost: "20000.00",
    utilities: "10000.00",
    electricityFeeProposal: "3000.00",
    academicFund: "15000.00",
    generalReserve: "5000.00",
    vendorCode: "",
    projectHead: "ผู้เสนอโครงการ (Mock)",
    startDate: "1 มิถุนายน 2569",
    endDate: "30 กันยายน 2569",
    fundOwner: "",
    serviceType: "",
    strategyType: "",
    targetGroup: "",
    participantCount: "40",
    projectDescription: "",
    amountGovExternal: "0.00",
    amountPrivateExternal: "0.00",
    amountForeignExternal: "0.00",
    amountUnivRevenue: "120000.00",
    status1: "",
    status1Date: "",
    status2: "",
    status2Date: "",
    status3: "",
    status3Date: "",
    status4: "",
    status4Date: "",
    status5: "",
    status5Date: "",
    responsible: "",
    docNumber: "",
    docDate: "",
    docLink: "",
    createdAt: new Date().toISOString(),
    _meetings: [],
    _costCenter: "",
    _costCenterFileName: "",
    _costCenterFileType: "",
    _costCenterUploadedAt: "",
    _costCenterDownloadUrl: "",
    _maintenanceFee: "0.00",
    _electricityFeeActual: "0.00",
    _researchComplete: false,
    _physicalComplete: false,
    _closureCompleteFinance: false,
    _canReleaseProject: false,
    _canCloseProject: false,
    _releaseChecklist: {
      hasProjectCode: true,
      hasVendor: false,
      hasCostCenter: false,
      hasDeanApproval: true,
    },
    _activeBudgetRevision: null,
    _internalReviewChecked: false,
    _latestInternalReviewAction: null,
    _departmentHeadUserId: "mock-user-department-head",
    _departmentHeadName: "หัวหน้าภาควิชาวิทยาศาสตร์ (Mock)",
    _draftState: "SUBMITTED" as const,
  };

  const make = (
    id: string,
    statusCode: string,
    overrides: Partial<EnhancedProjectData> = {},
  ): EnhancedProjectData => {
    const project = {
      ...base,
      id,
      memoTitle: `${base.memoTitle} ${statusCode}`,
      projectCode:
        statusCode === "STATUS_6" ||
        statusCode === "STATUS_7" ||
        statusCode === "STATUS_13"
          ? `SCI-2569-${id.slice(-3)}`
          : "ยังไม่อนุมัติ",
      _projectStatus: displayStatusFromCode(statusCode),
      _currentStatusCode: statusCode,
      _statusGroup:
        statusCode === "DRAFT"
          ? "DRAFT"
          : statusCode === "STATUS_0"
            ? "DEPT_HEAD"
            : statusCode === "STATUS_1" || statusCode === "STATUS_2"
              ? "RESEARCH_REVIEW"
              : statusCode === "STATUS_3"
                ? "WAITING_MEETING"
                : statusCode === "STATUS_4" || statusCode === "STATUS_5"
                  ? "WAITING_UNIT_DATA"
                  : statusCode === "STATUS_13"
                    ? "CLOSED"
                    : "ACTIVE",
      _routeType:
        statusCode === "STATUS_5" || statusCode === "STATUS_7"
          ? "DEAN"
          : statusCode === "STATUS_4" || statusCode === "STATUS_6"
            ? "BOARD"
            : "NONE",
      _nextWorkLabel: "งานจำลองสำหรับทดลอง flow",
      _needsActionBy: [],
      _rolePriority: {},
      ...overrides,
    } as EnhancedProjectData;

    const needs = project._needsActionBy ?? [];
    project._rolePriority = mockActors.reduce(
      (acc, actor) => {
        acc[actor.role] = needs.includes(actor.role) ? 0 : 3;
        return acc;
      },
      {} as Record<UserRole, number>,
    );
    return project;
  };

  return [
    make("mock-draft", "DRAFT", {
      memoTitle: "ตัวอย่าง Draft - เจ้าของโครงการจัดทำข้อมูล",
      _nextWorkLabel: "รอเจ้าของโครงการยื่นเสนอ",
      _needsActionBy: ["USER"],
    }),
    make("mock-status-0", "STATUS_0", {
      memoTitle: "ตัวอย่าง State 0 - รอหัวหน้าภาควิชา",
      _nextWorkLabel: "รอหัวหน้าภาควิชาอนุมัติ",
      _needsActionBy: ["ภาควิชาวิทยาศาสตร์"],
    }),
    make("mock-status-1", "STATUS_1", {
      memoTitle: "ตัวอย่าง State 1 - ฝ่ายวิจัยตรวจสอบ",
      _nextWorkLabel: "รอฝ่ายวิจัยตรวจสอบข้อมูล",
      _needsActionBy: ["งานวิจัย"],
    }),
    make("mock-status-2", "STATUS_2", {
      memoTitle: "ตัวอย่าง State 2 - หัวหน้าฝ่ายวิจัยพิจารณา",
      _nextWorkLabel: "รอหัวหน้าฝ่ายวิจัยพิจารณา",
      _needsActionBy: ["หัวหน้าฝ่ายวิจัย"],
      _internalReviewChecked: true,
    }),
    make("mock-status-3", "STATUS_3", {
      memoTitle: "ตัวอย่าง State 3 - รอบันทึกมติ",
      _nextWorkLabel: "รอฝ่ายวิจัยบันทึกมติ",
      _needsActionBy: ["งานวิจัย"],
      boardMeetingNo: "4/2569",
      boardMeetingDate: "8 พฤษภาคม 2569",
      _meetings: [
        {
          id: "mock-meeting-board",
          type: "BOARD",
          no: "4/2569",
          date: "2026-05-08",
          purpose: "พิจารณาอนุมัติโครงการ",
        },
      ],
    }),
    make("mock-status-4", "STATUS_4", {
      memoTitle: "ตัวอย่าง State 4 - รอข้อมูลจากแผนและคลัง",
      boardMeetingNo: "4/2569",
      boardMeetingDate: "8 พฤษภาคม 2569",
      _nextWorkLabel: "รอรหัสเจ้าหนี้จากงานคลัง · รอศูนย์ต้นทุนจากงานแผน",
      _needsActionBy: ["งานแผน", "งานคลัง"],
    }),
    make("mock-status-5", "STATUS_5", {
      memoTitle: "ตัวอย่าง State 5 - รอเอกสารคณบดีและข้อมูลประกอบ",
      boardMeetingNo: "4/2569",
      boardMeetingDate: "8 พฤษภาคม 2569",
      deanDecisionNo: "2/2569",
      deanDecisionDate: "12 พฤษภาคม 2569",
      _releaseChecklist: {
        hasProjectCode: true,
        hasVendor: true,
        hasCostCenter: false,
        hasDeanApproval: false,
      },
      vendorCode: "V-1020",
      _costCenterFileName: "",
      _nextWorkLabel: "รอศูนย์ต้นทุนจากงานแผน · รอเอกสารอนุมัติคณบดี",
      _needsActionBy: ["งานแผน", "งานวิจัย"],
    }),
    make("mock-status-6", "STATUS_6", {
      memoTitle: "ตัวอย่าง State 6 - อนุมัติให้ดำเนินโครงการ",
      vendorCode: "V-2040",
      _costCenter: "ไฟล์รหัสศูนย์ต้นทุนและเขตตามหน้าที่.xlsx",
      _costCenterFileName: "ไฟล์รหัสศูนย์ต้นทุนและเขตตามหน้าที่.xlsx",
      _costCenterFileType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      _costCenterUploadedAt: "8 พฤษภาคม 2569",
      _costCenterDownloadUrl: "#",
      _maintenanceFee: "0.00",
      _electricityFeeActual: "0.00",
      _nextWorkLabel: "งานกายภาพยังไม่บันทึก · งานคลังยังไม่ยืนยัน",
      _needsActionBy: ["กายภาพ", "งานคลัง"],
      _releaseChecklist: {
        hasProjectCode: true,
        hasVendor: true,
        hasCostCenter: true,
        hasDeanApproval: true,
      },
    }),
    make("mock-status-7", "STATUS_7", {
      memoTitle: "ตัวอย่าง State 7 - มีคำขอแก้ไขงบประมาณ",
      vendorCode: "V-3040",
      _costCenter: "ไฟล์รหัสศูนย์ต้นทุนและเขตตามหน้าที่.xlsx",
      _costCenterFileName: "ไฟล์รหัสศูนย์ต้นทุนและเขตตามหน้าที่.xlsx",
      _costCenterFileType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      _costCenterUploadedAt: "8 พฤษภาคม 2569",
      _costCenterDownloadUrl: "#",
      docLink: "https://example.local/report.pdf",
      _activeBudgetRevision: {
        id: "mock-budget-revision",
        status: "BR_SUBMITTED",
        reason: "ปรับงบค่าใช้สอยตามจำนวนผู้เข้าร่วมจริง",
        closeAfterApproval: false,
        affectsCostCenter: true,
        affectsVendor: false,
      },
      _nextWorkLabel: "มีคำขอแก้ไขงบประมาณ",
      _needsActionBy: ["งานวิจัย"],
    }),
    make("mock-status-13", "STATUS_13", {
      memoTitle: "ตัวอย่าง State 13 - ปิดโครงการแล้ว",
      _nextWorkLabel: "ปิดโครงการแล้ว",
      _needsActionBy: [],
      _researchComplete: true,
      _physicalComplete: true,
      _closureCompleteFinance: true,
    }),
  ];
};

export default function ProjectTrackingPage() {
  const [userRole, setUserRole] = useState<UserRole>("USER");
  const [projects, setProjects] = useState<EnhancedProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [myWorkFilter, setMyWorkFilter] = useState<MyWorkFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("rolePriority");
  const [isMockMode, setIsMockMode] = useState(false);

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
  const [savingStatusAction, setSavingStatusAction] = useState<string | null>(
    null,
  );
  const [savingBudgetRevisionAction, setSavingBudgetRevisionAction] = useState<
    string | null
  >(null);
  const [savingCostCenterFileProjectId, setSavingCostCenterFileProjectId] =
    useState<string | null>(null);
  // Modal for meetings management
  const [editingMeetings, setEditingMeetings] = useState<{
    projectId: string;
    list: MeetingRecord[];
    deanApprovalLink: string;
  } | null>(null);
  const [activeMeetingTab, setActiveMeetingTab] = useState<"BOARD" | "DEAN">(
    "BOARD",
  );

  const currentActor = mockActorByRole[userRole];

  // --- Load & Transform ---
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

  useEffect(() => {
    loadProjects();
  }, []);

  const handleEnterMockMode = () => {
    setIsMockMode(true);
    setIsLoading(false);
    setProjects(createMockProjects());
    setStatusFilter("all");
    setMyWorkFilter("all");
    setSortOption("rolePriority");
  };

  const handleExitMockMode = async () => {
    setIsMockMode(false);
    await loadProjects();
  };

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
      if (isMockMode) {
        updateLocalProject(editingCell.projectId, (project) =>
          recalcReleaseState({
            ...project,
            [editingCell.field]: editingValue,
          } as EnhancedProjectData),
        );
        setEditingCell(null);
        setEditingValue("");
        return;
      }

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
            actorUserId: currentActor.id,
          }),
        },
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof responseData?.error === "string"
            ? responseData.error
            : "Failed to update field",
        );
      }

      const savedValue =
        editingCell.field === "_projectStatus" && responseData?.data
          ? (responseData.data.displayStatus ?? editingValue)
          : editingValue;

      handleUpdateField(
        editingCell.projectId,
        editingCell.field as keyof EnhancedProjectData,
        savedValue,
      );

      if (editingCell.field === "_projectStatus") {
        setProjects((prev) =>
          prev.map((project) =>
            project.id === editingCell.projectId
              ? {
                  ...project,
                  _internalReviewChecked:
                    getStatusKey(savedValue) === "1"
                      ? project._internalReviewChecked
                      : false,
                }
              : project,
          ),
        );
      }

      setEditingCell(null);
      setEditingValue("");
    } catch (error) {
      console.error("Error saving cell:", error);
      alert(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setSavingCell(null);
    }
  };

  const handleToggleCompletion = async (
    project: EnhancedProjectData,
    role: "RESEARCH" | "PHYSICAL" | "FINANCE",
    isComplete: boolean,
  ) => {
    setSavingCompletionProjectId(project.id);
    try {
      if (isMockMode) {
        setProjects((prev) =>
          prev.map((item) => {
            if (item.id !== project.id) return item;
            const nextResearch =
              role === "RESEARCH" ? isComplete : !!item._researchComplete;
            const nextPhysical =
              role === "PHYSICAL" ? isComplete : !!item._physicalComplete;
            const nextFinance =
              role === "FINANCE" ? isComplete : !!item._closureCompleteFinance;
            return {
              ...item,
              _researchComplete: nextResearch,
              _physicalComplete: nextPhysical,
              _closureCompleteFinance: nextFinance,
              _canCloseProject: nextResearch && nextPhysical && nextFinance,
            };
          }),
        );
        return;
      }

      const response = await fetch(`/api/overviews/${project.id}/completion`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          isComplete,
          actorRole: userRole,
          actorUserId: currentActor.id,
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
          const nextFinance =
            role === "FINANCE" ? isComplete : !!item._closureCompleteFinance;
          return {
            ...item,
            _researchComplete: nextResearch,
            _physicalComplete: nextPhysical,
            _closureCompleteFinance: nextFinance,
            _canCloseProject: nextResearch && nextPhysical && nextFinance,
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

  const handleStatusAction = async (
    project: EnhancedProjectData,
    action: StatusAction,
  ) => {
    const actionKey = `${project.id}-${action}`;
    setSavingStatusAction(actionKey);

    try {
      if (isMockMode) {
        const actionToStatus: Partial<Record<StatusAction, string>> = {
          SUBMIT_DRAFT: "STATUS_0",
          DEPT_APPROVE: "STATUS_1",
          COMPLETE_RESEARCH_REVIEW: "STATUS_2",
          RETURN_FOR_REVISION: "STATUS_1",
          APPROVE_TO_BOARD: "STATUS_3",
          BOARD_APPROVE_TO_WAITING_RELEASE: "STATUS_4",
          DEAN_APPROVE_TO_WAITING_RELEASE: "STATUS_5",
          RELEASE_BOARD_PROJECT: "STATUS_6",
          RELEASE_DEAN_PROJECT: "STATUS_7",
          CLOSE_PROJECT: "STATUS_13",
          RESUME_RECALL: "DRAFT",
        };

        if (action === "MARK_INTERNAL_REVIEW_CHECKED") {
          updateLocalProject(project.id, (item) => ({
            ...item,
            _internalReviewChecked: true,
            _latestInternalReviewAction: {
              actorRole: userRole,
              actorName: currentActor.name,
              createdAt: new Date().toLocaleDateString("th-TH"),
            },
          }));
          return;
        }

        const nextCode = actionToStatus[action];
        if (nextCode) {
          updateLocalProject(project.id, (item) =>
            recalcReleaseState({
              ...item,
              _currentStatusCode: nextCode,
              _projectStatus: displayStatusFromCode(nextCode),
              _statusGroup:
                nextCode === "DRAFT"
                  ? "DRAFT"
                  : nextCode === "STATUS_0"
                    ? "DEPT_HEAD"
                    : nextCode === "STATUS_1" || nextCode === "STATUS_2"
                      ? "RESEARCH_REVIEW"
                      : nextCode === "STATUS_3"
                        ? "WAITING_MEETING"
                        : nextCode === "STATUS_4" || nextCode === "STATUS_5"
                          ? "WAITING_UNIT_DATA"
                          : nextCode === "STATUS_13"
                            ? "CLOSED"
                            : "ACTIVE",
              _routeType:
                nextCode === "STATUS_5" || nextCode === "STATUS_7"
                  ? "DEAN"
                  : nextCode === "STATUS_4" || nextCode === "STATUS_6"
                    ? "BOARD"
                    : "NONE",
              projectCode:
                nextCode === "STATUS_6" || nextCode === "STATUS_7"
                  ? item.projectCode === "ยังไม่อนุมัติ"
                    ? `MOCK-${item.id.slice(-4).toUpperCase()}`
                    : item.projectCode
                  : item.projectCode,
              _internalReviewChecked:
                nextCode === "STATUS_1" ? item._internalReviewChecked : false,
            }),
          );
        }
        return;
      }

      const response = await fetch(
        `/api/overviews/${project.id}/status-action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            actorRole: userRole,
            actorUserId: currentActor.id,
          }),
        },
      );

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof responseData?.error === "string"
            ? responseData.error
            : "ดำเนินการสถานะไม่สำเร็จ",
        );
      }

      const data = responseData?.data;
      setProjects((prev) =>
        prev.map((item) => {
          if (item.id !== project.id) return item;

          if (action === "MARK_INTERNAL_REVIEW_CHECKED") {
            return {
              ...item,
              _internalReviewChecked: true,
              _latestInternalReviewAction: {
                actorRole: userRole,
                actorName: currentActor.name,
                createdAt: new Date().toLocaleDateString("th-TH"),
              },
            };
          }

          const nextStatus = data?.displayStatus ?? item._projectStatus;
          return {
            ...item,
            _projectStatus: nextStatus,
            _currentStatusCode:
              data?.currentStatusCode ?? item._currentStatusCode,
            projectCode: data?.project?.projectCode ?? item.projectCode,
            _internalReviewChecked:
              getStatusKey(nextStatus) === "1"
                ? item._internalReviewChecked
                : false,
          };
        }),
      );
    } catch (error) {
      console.error("Error running status action:", error);
      alert(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการดำเนินการสถานะ",
      );
    } finally {
      setSavingStatusAction(null);
    }
  };

  const handleCreateBudgetRevision = async (project: EnhancedProjectData) => {
    const reason = window.prompt("เหตุผลการขอแก้ไขงบประมาณ");
    if (!reason?.trim()) return;

    const proposedBudgetText = window.prompt(
      'ระบุงบประมาณใหม่เป็น JSON หรือเว้นว่างเพื่อใช้ตัวเลขเดิม เช่น {"expenseSupplies":1000}',
      "{}",
    );

    let proposedBudget: Record<string, number> = {};
    try {
      proposedBudget = proposedBudgetText?.trim()
        ? JSON.parse(proposedBudgetText)
        : {};
    } catch {
      alert("รูปแบบ JSON ไม่ถูกต้อง");
      return;
    }

    setSavingBudgetRevisionAction(`${project.id}-CREATE`);
    try {
      if (isMockMode) {
        updateLocalProject(project.id, (item) => ({
          ...item,
          _activeBudgetRevision: {
            id: `mock-br-${Date.now()}`,
            status: "BR_SUBMITTED",
            reason,
            closeAfterApproval: false,
            affectsCostCenter: false,
            affectsVendor: false,
          },
          _nextWorkLabel: "มีคำขอแก้ไขงบประมาณ",
          _needsActionBy: ["งานวิจัย"],
          _rolePriority: { ...item._rolePriority, งานวิจัย: 0 },
        }));
        return;
      }

      const response = await fetch(
        `/api/projects/${project.id}/budget-revisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorRole: userRole,
            actorUserId: currentActor.id,
            reason,
            proposedBudget,
          }),
        },
      );

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          responseData?.error ?? "สร้างคำขอแก้ไขงบประมาณไม่สำเร็จ",
        );
      }

      const revision = responseData?.data?.revision;
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? {
                ...item,
                _activeBudgetRevision: revision
                  ? {
                      id: revision.id,
                      status: revision.status,
                      reason: revision.reason,
                      closeAfterApproval: revision.closeAfterApproval,
                      affectsCostCenter: revision.affectsCostCenter,
                      affectsVendor: revision.affectsVendor,
                    }
                  : item._activeBudgetRevision,
              }
            : item,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingBudgetRevisionAction(null);
    }
  };

  const handleBudgetRevisionAction = async (
    project: EnhancedProjectData,
    action: BudgetRevisionAction,
  ) => {
    const revision = project._activeBudgetRevision;
    if (!revision) return;

    const actionKey = `${revision.id}-${action}`;
    setSavingBudgetRevisionAction(actionKey);

    try {
      if (isMockMode) {
        const nextStatusByAction: Partial<
          Record<BudgetRevisionAction, BudgetRevisionStatus>
        > = {
          RESEARCH_CHECK: "BR_RESEARCH_CHECKED",
          RETURN_TO_OWNER: "BR_DRAFT",
          APPROVE_TO_MEETING: "BR_WAITING_MEETING",
          MARK_BOARD_APPROVED: "BR_BOARD_APPROVED",
          MARK_DEAN_APPROVED: "BR_DEAN_APPROVED",
        };
        updateLocalProject(project.id, (item) => {
          if (
            action === "APPLY" ||
            action === "REJECT" ||
            action === "CANCEL"
          ) {
            return {
              ...item,
              _activeBudgetRevision: null,
              _currentStatusCode:
                action === "APPLY" && revision.status === "BR_DEAN_APPROVED"
                  ? "STATUS_7"
                  : item._currentStatusCode,
              _projectStatus:
                action === "APPLY" && revision.status === "BR_DEAN_APPROVED"
                  ? displayStatusFromCode("STATUS_7")
                  : item._projectStatus,
              _routeType:
                action === "APPLY" && revision.status === "BR_DEAN_APPROVED"
                  ? "DEAN"
                  : item._routeType,
            };
          }
          return {
            ...item,
            _activeBudgetRevision: item._activeBudgetRevision
              ? {
                  ...item._activeBudgetRevision,
                  status:
                    nextStatusByAction[action] ??
                    item._activeBudgetRevision.status,
                }
              : null,
          };
        });
        return;
      }

      if (action === "MARK_BOARD_APPROVED" || action === "MARK_DEAN_APPROVED") {
        const meetingNo = window.prompt(
          "ครั้งที่ประชุม",
          revision.meetingNo ?? "",
        );
        if (!meetingNo) return;
        const meetingDate = window.prompt("วันที่ประชุม (YYYY-MM-DD)", "");
        if (!meetingDate) return;
        const deanApprovalFileUrl =
          action === "MARK_DEAN_APPROVED"
            ? window.prompt(
                "เอกสาร/ลิงก์อนุมัติจากคณบดี",
                revision.deanApprovalFileUrl ?? "",
              )
            : undefined;

        const updateResponse = await fetch(
          `/api/budget-revisions/${revision.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actorRole: userRole,
              actorUserId: currentActor.id,
              meetingNo,
              meetingDate,
              deanApprovalFileUrl,
            }),
          },
        );
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => null);
          throw new Error(errorData?.error ?? "บันทึกข้อมูลมติไม่สำเร็จ");
        }
      }

      const response = await fetch(
        `/api/budget-revisions/${revision.id}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            actorRole: userRole,
            actorUserId: currentActor.id,
          }),
        },
      );

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          responseData?.error ?? "ดำเนินการคำขอแก้ไขงบประมาณไม่สำเร็จ",
        );
      }

      const updatedRevision = responseData?.data?.revision;
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? {
                ...item,
                _activeBudgetRevision:
                  updatedRevision?.status === "BR_APPLIED" ||
                  updatedRevision?.status === "BR_REJECTED" ||
                  updatedRevision?.status === "BR_CANCELLED"
                    ? null
                    : {
                        ...(item._activeBudgetRevision ?? revision),
                        status: updatedRevision?.status ?? revision.status,
                      },
              }
            : item,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingBudgetRevisionAction(null);
    }
  };

  const isValidCostCenterFile = (file: File) =>
    /\.(xlsx|xls|csv|pdf)$/i.test(file.name);

  const handleUploadCostCenterFile = async (
    project: EnhancedProjectData,
    file: File,
  ) => {
    if (!isValidCostCenterFile(file)) {
      alert("รองรับเฉพาะไฟล์ .xlsx, .xls, .csv หรือ .pdf");
      return;
    }

    setSavingCostCenterFileProjectId(project.id);
    try {
      if (isMockMode) {
        updateLocalProject(project.id, (item) =>
          recalcReleaseState({
            ...item,
            _costCenter: file.name,
            _costCenterFileName: file.name,
            _costCenterFileType: file.type,
            _costCenterUploadedAt: new Date().toLocaleDateString("th-TH"),
            _costCenterDownloadUrl: "#",
          }),
        );
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/overviews/${project.id}/cost-center-file`,
        {
          method: "POST",
          headers: {
            "x-actor-role": userRole,
            "x-actor-user-id": currentActor.id,
          },
          body: formData,
        },
      );

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error ?? "แนบไฟล์ศูนย์ต้นทุนไม่สำเร็จ");
      }

      const uploadedFile = responseData?.data?.file;
      updateLocalProject(project.id, (item) =>
        recalcReleaseState({
          ...item,
          _costCenter: responseData?.data?.costCenter ?? file.name,
          _costCenterFileName: uploadedFile?.name ?? file.name,
          _costCenterFileType: uploadedFile?.type ?? file.type,
          _costCenterUploadedAt: uploadedFile?.uploadedAt
            ? new Date(uploadedFile.uploadedAt).toLocaleDateString("th-TH")
            : new Date().toLocaleDateString("th-TH"),
          _costCenterDownloadUrl:
            uploadedFile?.downloadUrl ??
            `/api/overviews/${project.id}/cost-center-file`,
        }),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingCostCenterFileProjectId(null);
    }
  };

  const openCostCenterFilePicker = (project: EnhancedProjectData) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv,.pdf";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        handleUploadCostCenterFile(project, file);
      }
    };
    input.click();
  };

  const handleDownloadCostCenterFile = (project: EnhancedProjectData) => {
    if (isMockMode) {
      alert("โหมดจำลองไม่มีไฟล์จริงสำหรับดาวน์โหลด");
      return;
    }

    const url =
      project._costCenterDownloadUrl ||
      `/api/overviews/${project.id}/cost-center-file`;
    window.open(url, "_blank");
  };

  const handleDeleteCostCenterFile = async (project: EnhancedProjectData) => {
    setSavingCostCenterFileProjectId(project.id);
    try {
      if (isMockMode) {
        updateLocalProject(project.id, (item) =>
          recalcReleaseState({
            ...item,
            _costCenter: "",
            _costCenterFileName: "",
            _costCenterFileType: "",
            _costCenterUploadedAt: "",
            _costCenterDownloadUrl: "",
          }),
        );
        return;
      }

      const response = await fetch(
        `/api/overviews/${project.id}/cost-center-file`,
        {
          method: "DELETE",
          headers: {
            "x-actor-role": userRole,
            "x-actor-user-id": currentActor.id,
          },
        },
      );

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error ?? "ลบไฟล์ศูนย์ต้นทุนไม่สำเร็จ");
      }

      updateLocalProject(project.id, (item) =>
        recalcReleaseState({
          ...item,
          _costCenter: "",
          _costCenterFileName: "",
          _costCenterFileType: "",
          _costCenterUploadedAt: "",
          _costCenterDownloadUrl: "",
        }),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingCostCenterFileProjectId(null);
    }
  };

  const hasPermission = (fieldKey: string) => {
    const allowedRoles = ROLE_PERMISSIONS[fieldKey];
    return allowedRoles && allowedRoles.includes(userRole);
  };

  const isColumnEditable = (col: (typeof COLUMNS)[0]) => {
    return col.editable && hasPermission(col.key);
  };

  const openMeetingsModal = (project: EnhancedProjectData) => {
    const statusKey = getStatusKey(project._projectStatus);
    setActiveMeetingTab(
      statusKey === "5" || statusKey === "7" ? "DEAN" : "BOARD",
    );
    setEditingMeetings({
      projectId: project.id,
      list: [...project._meetings],
      deanApprovalLink:
        project.docLink || project._meetingSummary?.dean?.approvalLink || "",
    });
  };

  const updateLocalProject = (
    projectId: string,
    updater: (project: EnhancedProjectData) => EnhancedProjectData,
  ) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? updater(project) : project,
      ),
    );
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

      const nextBoard = editingMeetings.list.find((m) => m.type === "BOARD");
      const nextDean = editingMeetings.list.find((m) => m.type === "DEAN");
      const applyMeetingsToLocalState = () => {
        updateLocalProject(editingMeetings.projectId, (project) =>
          recalcReleaseState({
            ...project,
            _meetings: editingMeetings.list,
            boardMeetingNo: nextBoard?.no || "",
            boardMeetingDate: formatMeetingDate(nextBoard?.date),
            deanDecisionNo: nextDean?.no || "",
            deanDecisionDate: formatMeetingDate(nextDean?.date),
            purpose:
              editingMeetings.list[editingMeetings.list.length - 1]?.purpose ||
              "-",
            docLink: editingMeetings.deanApprovalLink,
            _meetingSummary: {
              board: nextBoard
                ? {
                    id: nextBoard.id,
                    no: nextBoard.no,
                    date: formatMeetingDate(nextBoard.date),
                    purpose: nextBoard.purpose,
                  }
                : null,
              dean: nextDean
                ? {
                    id: nextDean.id,
                    no: nextDean.no,
                    date: formatMeetingDate(nextDean.date),
                    purpose: nextDean.purpose,
                    approvalLink: editingMeetings.deanApprovalLink,
                  }
                : null,
            },
          }),
        );
      };

      try {
        if (isMockMode) {
          applyMeetingsToLocalState();
          setEditingMeetings(null);
          return;
        }

        const response = await fetch(
          `/api/overviews/${editingMeetings.projectId}/meetings`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              meetings: editingMeetings.list,
              deanApprovalLink: editingMeetings.deanApprovalLink,
              actorRole: userRole,
              actorUserId: currentActor.id,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to update meetings");
        }

        applyMeetingsToLocalState();
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
    const filtered = projects.filter((p) => {
      const matchesSearch =
        !query ||
        p.projectCode.toLowerCase().includes(query) ||
        p.memoTitle.toLowerCase().includes(query) ||
        p.vendorCode.toLowerCase().includes(query) ||
        p.department.toLowerCase().includes(query);
      const matchesDepartment =
        departmentFilter === "all" || p.department === departmentFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "BUDGET_REVISION"
          ? Boolean(p._activeBudgetRevision)
          : p._statusGroup === statusFilter);
      const matchesMyWork =
        myWorkFilter === "all" ||
        (myWorkFilter === "needsMe"
          ? Boolean(p._needsActionBy?.includes(userRole))
          : myWorkFilter === "editableByMe"
            ? canRoleEditProject(p, userRole)
            : Boolean(p._activeBudgetRevision));
      return (
        matchesSearch && matchesDepartment && matchesStatus && matchesMyWork
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "rolePriority") {
        const aPriority = a._rolePriority?.[userRole] ?? 3;
        const bPriority = b._rolePriority?.[userRole] ?? 3;
        if (aPriority !== bPriority) return aPriority - bPriority;
        const aStatus = STATUS_ORDER[a._currentStatusCode ?? ""] ?? 99;
        const bStatus = STATUS_ORDER[b._currentStatusCode ?? ""] ?? 99;
        if (aStatus !== bStatus) return aStatus - bStatus;
        return a.memoTitle.localeCompare(b.memoTitle, "th");
      }

      if (sortOption === "status") {
        const aStatus = STATUS_ORDER[a._currentStatusCode ?? ""] ?? 99;
        const bStatus = STATUS_ORDER[b._currentStatusCode ?? ""] ?? 99;
        return aStatus - bStatus;
      }

      if (sortOption === "budgetDesc") {
        return Number(b.totalBudget || 0) - Number(a.totalBudget || 0);
      }

      if (sortOption === "projectName") {
        return a.memoTitle.localeCompare(b.memoTitle, "th");
      }

      if (sortOption === "createdAt") {
        return (
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
        );
      }

      return 0;
    });
  }, [
    projects,
    searchQuery,
    departmentFilter,
    statusFilter,
    myWorkFilter,
    sortOption,
    userRole,
  ]);

  const departments = useMemo(() => {
    const depts = new Set(projects.map((p) => p.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [projects]);

  const getWorkflowActions = (project: EnhancedProjectData) => {
    const statusKey = getStatusKey(project._projectStatus);
    const hasBoardMeeting = project._meetings.some(
      (meeting) => meeting.type === "BOARD",
    );
    const isAssignedDepartmentHead =
      Boolean(project._departmentHeadUserId) &&
      project._departmentHeadUserId === currentActor.id;

    const actions: Array<{
      action: StatusAction;
      label: string;
      role: UserRole;
      variant?: "default" | "outline";
      disabled?: boolean;
      reason?: string;
    }> = [];

    if (statusKey === "DRAFT") {
      actions.push({
        action: "SUBMIT_DRAFT",
        label: "ยื่นเสนอหัวหน้าภาค",
        role: "USER",
      });
    } else if (statusKey === "0") {
      actions.push({
        action: "DEPT_APPROVE",
        label: "อนุมัติส่งฝ่ายวิจัย",
        role: "ภาควิชาวิทยาศาสตร์",
        disabled: !isAssignedDepartmentHead,
        reason: project._departmentHeadName
          ? `ต้องเป็นหัวหน้าภาคที่กำหนด: ${formatActorName(
              project._departmentHeadName,
            )}`
          : "ยังไม่ได้กำหนดหัวหน้าภาค",
      });
    } else if (statusKey === "1") {
      if (!project._internalReviewChecked) {
        actions.push({
          action: "MARK_INTERNAL_REVIEW_CHECKED",
          label: "ตรวจสอบแล้ว (1.5)",
          role: "งานวิจัย",
          variant: "outline",
        });
      } else {
        actions.push({
          action: "COMPLETE_RESEARCH_REVIEW",
          label: "เสนอหัวหน้าฝ่ายวิจัย",
          role: "งานวิจัย",
        });
      }
    } else if (statusKey === "2") {
      actions.push({
        action: "RETURN_FOR_REVISION",
        label: "ส่งกลับแก้ไข",
        role: "งานวิจัย",
        variant: "outline",
      });
      actions.push({
        action: "APPROVE_TO_BOARD",
        label: "อนุมัติเสนอเข้าที่ประชุม",
        role: "หัวหน้าฝ่ายวิจัย",
      });
    } else if (statusKey === "3") {
      actions.push({
        action: "BOARD_APPROVE_TO_WAITING_RELEASE",
        label: "บันทึกมติคณะกรรมการฯ",
        role: "งานวิจัย",
        disabled: !hasBoardMeeting,
        reason: "ต้องบันทึกมติคณะกรรมการฯ ก่อน",
      });
      actions.push({
        action: "DEAN_APPROVE_TO_WAITING_RELEASE",
        label: "บันทึกมติคณบดี",
        role: "งานวิจัย",
        disabled: !hasBoardMeeting,
        reason: "ต้องบันทึกมติคณะกรรมการฯ ก่อน",
      });
    } else if (statusKey === "4") {
      actions.push({
        action: "RELEASE_BOARD_PROJECT",
        label: "อนุมัติดำเนินโครงการ",
        role: "งานวิจัย",
        disabled: !project._canReleaseProject,
        reason: "ต้องมีรหัสเจ้าหนี้และศูนย์ต้นทุนครบถ้วน",
      });
    } else if (statusKey === "5") {
      actions.push({
        action: "RELEASE_DEAN_PROJECT",
        label: "อนุมัติดำเนินโครงการ",
        role: "งานวิจัย",
        disabled: !project._canReleaseProject,
        reason: "ต้องมีรหัสเจ้าหนี้ ศูนย์ต้นทุน และเอกสารอนุมัติคณบดีครบถ้วน",
      });
    } else if (statusKey === "6") {
      actions.push({
        action: "CLOSE_PROJECT",
        label: "ปิดโครงการ",
        role: "งานวิจัย",
        disabled: !project._canCloseProject,
        reason: "ต้องมีรายงานและการยืนยันจากฝ่ายวิจัย งานกายภาพ และงานคลัง",
      });
    } else if (statusKey === "7") {
      actions.push({
        action: "CLOSE_PROJECT",
        label: "ปิดโครงการ",
        role: "งานวิจัย",
        disabled: !project._canCloseProject,
        reason: "ต้องมีรายงานและการยืนยันจากฝ่ายวิจัย งานกายภาพ และงานคลัง",
      });
    } else if (statusKey === "RECALL") {
      actions.push({
        action: "RESUME_RECALL",
        label: "อนุมัติกลับแบบร่าง",
        role: "งานวิจัย",
      });
    }

    return actions;
  };

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
      const code = (value as string) || "";
      const isUnapproved = code === "ยังไม่อนุมัติ" || !code;
      return (
        <Link
          href={`/projects/${project.id}`}
          className={`text-sm font-semibold hover:underline ${
            isUnapproved
              ? "text-slate-500 hover:text-slate-700"
              : "text-indigo-900 hover:text-indigo-600"
          }`}
        >
          {isUnapproved ? "ยังไม่อนุมัติ" : code}
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
            onClick={() => openMeetingsModal(project)}
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
      const summary =
        col.key === "boardMeetingNo" || col.key === "boardMeetingDate"
          ? project._meetingSummary?.board
          : project._meetingSummary?.dean;
      const displayValue =
        col.key === "boardMeetingNo" || col.key === "deanDecisionNo"
          ? summary?.no
            ? `ครั้งที่ ${summary.no}`
            : ""
          : summary?.date || (value as string);

      return (
        <div className="flex items-start justify-between group">
          <div className="text-sm text-slate-700 flex-1 leading-relaxed">
            {displayValue || "-"}
            {(col.key === "boardMeetingNo" || col.key === "deanDecisionNo") &&
              summary?.purpose && (
                <div className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                  {summary.purpose}
                </div>
              )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 mt-0.5"
            onClick={() => openMeetingsModal(project)}
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

    // 3. Special Case: Project Status (Workflow Actions)
    if (col.key === "_projectStatus") {
      const statusNumber = getStatusKey(value as string);
      const isActiveProject = statusNumber === "6" || statusNumber === "7";
      const isWaitingRelease = statusNumber === "4" || statusNumber === "5";
      const isStatus1 = statusNumber === "1";
      const canManageResearch = userRole === "งานวิจัย";
      const canManagePhysical = userRole === "กายภาพ";
      const canManageFinance = userRole === "งานคลัง";
      const workflowActions = getWorkflowActions(project);
      const budgetRevision = project._activeBudgetRevision;
      const routeBadgeLabel = getRouteBadgeLabel(project);
      const budgetRevisionActions: Array<{
        action: BudgetRevisionAction;
        label: string;
        role: UserRole;
      }> = [];

      if (budgetRevision) {
        if (budgetRevision.status === "BR_SUBMITTED") {
          budgetRevisionActions.push(
            {
              action: "RESEARCH_CHECK",
              label: "ตรวจสอบคำขอ",
              role: "งานวิจัย",
            },
            {
              action: "RETURN_TO_OWNER",
              label: "ส่งกลับให้แก้ไข",
              role: "งานวิจัย",
            },
            { action: "REJECT", label: "ปฏิเสธ", role: "งานวิจัย" },
          );
        } else if (budgetRevision.status === "BR_RESEARCH_CHECKED") {
          budgetRevisionActions.push({
            action: "APPROVE_TO_MEETING",
            label: "อนุมัติเสนอเข้าที่ประชุม",
            role: "หัวหน้าฝ่ายวิจัย",
          });
        } else if (budgetRevision.status === "BR_WAITING_MEETING") {
          budgetRevisionActions.push(
            {
              action: "MARK_BOARD_APPROVED",
              label: "บันทึกมติคณะกรรมการฯ",
              role: "งานวิจัย",
            },
            {
              action: "MARK_DEAN_APPROVED",
              label: "บันทึกมติคณบดี",
              role: "งานวิจัย",
            },
          );
        } else if (
          budgetRevision.status === "BR_BOARD_APPROVED" ||
          budgetRevision.status === "BR_DEAN_APPROVED"
        ) {
          budgetRevisionActions.push({
            action: "APPLY",
            label: "บันทึกงบที่อนุมัติ",
            role: "งานวิจัย",
          });
        }
      }

      return (
        <div className={`space-y-2 ${alignClass}`}>
          <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusBadgeClass(
                  statusNumber,
                )}`}
                title={value as string}
              >
                {(value as string) || "-"}
              </span>
              {routeBadgeLabel && (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                  {routeBadgeLabel}
                </span>
              )}
            </div>
            <div className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-700">
                ขั้นตอนถัดไป:
              </span>{" "}
              {project._nextWorkLabel || "ตรวจสอบสถานะโครงการ"}
            </div>

            {isStatus1 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    project._internalReviewChecked
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  1.5{" "}
                  {project._internalReviewChecked ? "ตรวจสอบแล้ว" : "รอตรวจสอบ"}
                </span>
                {project._latestInternalReviewAction && (
                  <span className="text-[11px] text-slate-500">
                    โดย{" "}
                    {project._latestInternalReviewAction.actorName ||
                      project._latestInternalReviewAction.actorRole}
                  </span>
                )}
              </div>
            )}

            {isWaitingRelease && project._releaseChecklist && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(
                  [
                    [
                      "รหัสโครงการ: ออกเมื่ออนุมัติ",
                      project._releaseChecklist.hasProjectCode,
                    ],
                    ["รหัสเจ้าหนี้", project._releaseChecklist.hasVendor],
                    ["ศูนย์ต้นทุน", project._releaseChecklist.hasCostCenter],
                    ...(statusNumber === "5"
                      ? ([
                          [
                            "เอกสารอนุมัติคณบดี",
                            project._releaseChecklist.hasDeanApproval,
                          ],
                        ] as [string, boolean][])
                      : []),
                  ] as [string, boolean][]
                ).map(([label, done]) => (
                  <span
                    key={label}
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      done
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {done ? label : `รอ${label}`}
                  </span>
                ))}
              </div>
            )}

            {statusNumber === "3" && project._meetingSummary?.dean && (
              <div className="mt-2 flex items-start gap-1.5 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>
                  พบข้อมูลมติคณบดี: ครั้งที่{" "}
                  {project._meetingSummary.dean.no || "-"} กรุณาตรวจสอบว่าเป็น
                  กรณีอนุมัติพิเศษ
                </span>
              </div>
            )}

            {isActiveProject && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${project._researchComplete ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  ฝ่ายวิจัย{" "}
                  {project._researchComplete ? "บันทึกแล้ว" : "ยังไม่บันทึก"}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${project._physicalComplete ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  งานกายภาพ{" "}
                  {project._physicalComplete ? "บันทึกแล้ว" : "ยังไม่บันทึก"}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${project._closureCompleteFinance ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                >
                  งานคลัง{" "}
                  {project._closureCompleteFinance
                    ? "ยืนยันแล้ว"
                    : "ยังไม่ยืนยัน"}
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
                    {project._researchComplete
                      ? "ยกเลิกการยืนยัน"
                      : "ยืนยันข้อมูล"}
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
                    {project._physicalComplete
                      ? "ยกเลิกการยืนยัน"
                      : "ยืนยันข้อมูล"}
                  </Button>
                )}

                {canManageFinance && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px]"
                    onClick={() =>
                      handleToggleCompletion(
                        project,
                        "FINANCE",
                        !project._closureCompleteFinance,
                      )
                    }
                    disabled={savingCompletionProjectId === project.id}
                  >
                    {project._closureCompleteFinance
                      ? "ยกเลิกการยืนยัน"
                      : "ยืนยันงานคลัง"}
                  </Button>
                )}
              </div>
            )}

            {isActiveProject && userRole === "USER" && !budgetRevision && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => handleCreateBudgetRevision(project)}
                  disabled={
                    savingBudgetRevisionAction === `${project.id}-CREATE`
                  }
                >
                  ยื่นคำขอแก้ไขงบประมาณ
                </Button>
              </div>
            )}

            {budgetRevision && (
              <div className="mt-2 space-y-1 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
                <div className="font-medium">
                  คำขอแก้ไขงบประมาณ: {budgetRevision.status}
                </div>
                <div className="line-clamp-2">{budgetRevision.reason}</div>
                <div className="flex flex-wrap gap-1.5">
                  {budgetRevisionActions
                    .filter((action) => action.role === userRole)
                    .map((action) => {
                      const actionKey = `${budgetRevision.id}-${action.action}`;
                      return (
                        <Button
                          key={action.action}
                          size="sm"
                          variant="outline"
                          className="h-6 bg-white text-[11px]"
                          onClick={() =>
                            handleBudgetRevisionAction(project, action.action)
                          }
                          disabled={savingBudgetRevisionAction === actionKey}
                        >
                          {action.label}
                        </Button>
                      );
                    })}
                </div>
              </div>
            )}

            {statusNumber === "RECALL" && (
              <div className="mt-2 text-[11px] text-amber-700">
                อยู่ในขั้นดึงกลับเอกสาร
              </div>
            )}
          </div>

          {workflowActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {workflowActions
                .filter((action) => action.role === userRole)
                .map((action) => {
                  const actionKey = `${project.id}-${action.action}`;
                  const isSaving = savingStatusAction === actionKey;
                  return (
                    <Button
                      key={action.action}
                      size="sm"
                      variant={action.variant ?? "default"}
                      className="h-7 text-[11px]"
                      onClick={() => handleStatusAction(project, action.action)}
                      disabled={isSaving || action.disabled}
                      title={action.disabled ? action.reason : undefined}
                    >
                      {isSaving ? (
                        <Loader2 size={12} className="animate-spin mr-1" />
                      ) : action.action === "MARK_INTERNAL_REVIEW_CHECKED" ? (
                        <CheckCircle2 size={12} className="mr-1" />
                      ) : null}
                      {action.label}
                    </Button>
                  );
                })}
            </div>
          )}

          {workflowActions.some(
            (action) => action.role === userRole && action.disabled,
          ) && (
            <div className="text-[11px] text-amber-700">
              {
                workflowActions.find(
                  (action) => action.role === userRole && action.disabled,
                )?.reason
              }
            </div>
          )}
        </div>
      );
    }

    if (col.key === "_costCenter") {
      const statusKey = getStatusKey(project._projectStatus);
      const canManageCostCenter =
        userRole === "งานแผน" && ["4", "5", "6", "7"].includes(statusKey);
      const hasFile = Boolean(project._costCenterFileName);
      const isSavingCostCenterFile =
        savingCostCenterFileProjectId === project.id;

      return (
        <div className="space-y-2">
          {hasFile ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800">
              <div className="flex items-start gap-1.5">
                <FileSpreadsheet size={14} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {project._costCenterFileName}
                  </div>
                  {project._costCenterUploadedAt && (
                    <div className="mt-0.5 text-[11px] text-emerald-700">
                      แนบเมื่อ {project._costCenterUploadedAt}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-500">
              ยังไม่มีไฟล์ศูนย์ต้นทุน
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {hasFile && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => handleDownloadCostCenterFile(project)}
              >
                <Download size={12} className="mr-1" />
                ดาวน์โหลด
              </Button>
            )}

            {canManageCostCenter && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => openCostCenterFilePicker(project)}
                disabled={isSavingCostCenterFile}
              >
                {isSavingCostCenterFile ? (
                  <Loader2 size={12} className="mr-1 animate-spin" />
                ) : (
                  <Upload size={12} className="mr-1" />
                )}
                {hasFile ? "เปลี่ยนไฟล์" : "แนบไฟล์"}
              </Button>
            )}

            {canManageCostCenter && hasFile && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-red-200 text-[11px] text-red-600 hover:bg-red-50"
                onClick={() => handleDeleteCostCenterFile(project)}
                disabled={isSavingCostCenterFile}
              >
                <Trash2 size={12} className="mr-1" />
                ลบไฟล์
              </Button>
            )}
          </div>
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

  const getEditingMeeting = (type: "BOARD" | "DEAN") =>
    editingMeetings?.list.find((meeting) => meeting.type === type);

  const updateEditingMeeting = (
    type: "BOARD" | "DEAN",
    patch: Partial<MeetingRecord>,
  ) => {
    if (!editingMeetings) return;
    const existing = editingMeetings.list.find(
      (meeting) => meeting.type === type,
    );
    const nextMeeting: MeetingRecord = {
      id: existing?.id || `new-${type.toLowerCase()}-${Date.now()}`,
      type,
      no: "",
      date: "",
      purpose: "",
      ...existing,
      ...patch,
    };
    const nextList = existing
      ? editingMeetings.list.map((meeting) =>
          meeting.type === type ? nextMeeting : meeting,
        )
      : [...editingMeetings.list, nextMeeting];
    setEditingMeetings({ ...editingMeetings, list: nextList });
  };

  const clearEditingMeeting = (type: "BOARD" | "DEAN") => {
    if (!editingMeetings) return;
    setEditingMeetings({
      ...editingMeetings,
      list: editingMeetings.list.filter((meeting) => meeting.type !== type),
      deanApprovalLink: type === "DEAN" ? "" : editingMeetings.deanApprovalLink,
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-[family-name:var(--font-sarabun)]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 shadow-sm shrink-0 z-20">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <span className="font-bold text-indigo-600">
                      {ROLE_DISPLAY_LABELS[userRole]}
                    </span>
                    <span className="ml-1 text-slate-400">
                      ({formatActorName(currentActor.name)})
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <Input
                    type="text"
                    placeholder="ค้นหาโครงการ รหัส หรือรหัสเจ้าหนี้"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-72 text-sm"
                  />
                </div>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="h-9 text-sm bg-slate-100 border-slate-200 rounded px-3 focus:ring-indigo-500"
                >
                  {mockActors.map((actor) => (
                    <option key={actor.id} value={actor.role}>
                      {ROLE_DISPLAY_LABELS[actor.role]} -{" "}
                      {formatActorName(actor.name)}
                    </option>
                  ))}
                </select>
                <Button
                  variant={isMockMode ? "default" : "outline"}
                  size="sm"
                  className="h-9"
                  onClick={
                    isMockMode ? handleExitMockMode : handleEnterMockMode
                  }
                >
                  <FlaskConical size={14} className="mr-1.5" />
                  {isMockMode ? "กลับสู่ข้อมูลจริง" : "โหมดจำลอง"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={isMockMode ? handleExitMockMode : loadProjects}
                  title="โหลดข้อมูลใหม่"
                >
                  <RefreshCw size={15} />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <label className="text-xs font-semibold text-slate-500">
                สถานะโครงการ
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="h-8 text-sm bg-slate-100 border-slate-200 rounded px-3 focus:ring-indigo-500"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="ml-2 text-xs font-semibold text-slate-500">
                ภาควิชาที่จัดโครงการ
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-8 text-sm bg-slate-100 border-slate-200 rounded px-3 focus:ring-indigo-500"
              >
                <option value="all">ทุกภาควิชา</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <label className="ml-2 text-xs font-semibold text-slate-500">
                ประเภทงานของฉัน
              </label>
              <select
                value={myWorkFilter}
                onChange={(e) =>
                  setMyWorkFilter(e.target.value as MyWorkFilter)
                }
                className="h-8 text-sm bg-slate-100 border-slate-200 rounded px-3 focus:ring-indigo-500"
              >
                {MY_WORK_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="ml-2 text-xs font-semibold text-slate-500">
                เรียงลำดับ
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="h-8 text-sm bg-slate-100 border-slate-200 rounded px-3 focus:ring-indigo-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="ml-auto text-xs text-slate-500">
                แสดง {filteredProjects.length} จาก {projects.length} โครงการ
              </div>
            </div>

            {isMockMode && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                โหมดจำลอง ไม่มีการบันทึกข้อมูล
              </div>
            )}
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
                    บันทึกมติที่ประชุม
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รหัสอ้างอิง: {editingMeetings.projectId}
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
                <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-md border border-slate-200 text-sm">
                  <button
                    type="button"
                    onClick={() => setActiveMeetingTab("BOARD")}
                    className={`px-3 py-2 text-left font-semibold ${
                      activeMeetingTab === "BOARD"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    มติคณะกรรมการบริหารคณะวิทยาศาสตร์
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMeetingTab("DEAN")}
                    className={`px-3 py-2 text-left font-semibold ${
                      activeMeetingTab === "DEAN"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    มติคณบดี
                  </button>
                </div>

                {(() => {
                  const currentMeeting = getEditingMeeting(activeMeetingTab);
                  const canEditAny = hasPermission("_meetings");
                  const title =
                    activeMeetingTab === "BOARD"
                      ? "มติที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์"
                      : "มติคณบดี";

                  if (!canEditAny) {
                    return (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-slate-700">
                          {title}
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="rounded border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs text-slate-500">
                              ครั้งที่
                            </div>
                            <div className="mt-1 text-sm text-slate-800">
                              {currentMeeting?.no || "-"}
                            </div>
                          </div>
                          <div className="rounded border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs text-slate-500">วันที่</div>
                            <div className="mt-1 text-sm text-slate-800">
                              {formatMeetingDate(currentMeeting?.date) || "-"}
                            </div>
                          </div>
                          <div className="rounded border border-slate-200 bg-slate-50 p-3 md:col-span-1">
                            <div className="text-xs text-slate-500">
                              มติ/ข้อสั่งการ
                            </div>
                            <div className="mt-1 text-sm text-slate-800">
                              {currentMeeting?.purpose || "-"}
                            </div>
                          </div>
                        </div>
                        {activeMeetingTab === "DEAN" && (
                          <div className="rounded border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs text-slate-500">
                              เอกสาร/ลิงก์อนุมัติ
                            </div>
                            <div className="mt-1 break-all text-sm text-slate-800">
                              {editingMeetings.deanApprovalLink || "-"}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-700">
                            {title}
                          </div>
                          <div className="text-xs text-slate-500">
                            ข้อมูลส่วนนี้แยกจากมติอีกประเภท
                          </div>
                        </div>
                        {currentMeeting ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              clearEditingMeeting(activeMeetingTab)
                            }
                          >
                            ลบข้อมูลมตินี้
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateEditingMeeting(activeMeetingTab, {})
                            }
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มมติ
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            ครั้งที่
                          </label>
                          <Input
                            placeholder="เช่น 4/2569"
                            value={currentMeeting?.no || ""}
                            onChange={(e) =>
                              updateEditingMeeting(activeMeetingTab, {
                                no: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            วันที่
                          </label>
                          <Input
                            type="date"
                            value={currentMeeting?.date || ""}
                            onChange={(e) =>
                              updateEditingMeeting(activeMeetingTab, {
                                date: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">
                          มติ/ข้อสั่งการ
                        </label>
                        <Input
                          placeholder="สรุปมติหรือข้อสั่งการ"
                          value={currentMeeting?.purpose || ""}
                          onChange={(e) =>
                            updateEditingMeeting(activeMeetingTab, {
                              purpose: e.target.value,
                            })
                          }
                          className="text-sm"
                        />
                      </div>

                      {activeMeetingTab === "DEAN" && (
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            เอกสาร/ลิงก์อนุมัติ
                          </label>
                          <Input
                            placeholder="https://..."
                            value={editingMeetings.deanApprovalLink}
                            onChange={(e) =>
                              setEditingMeetings({
                                ...editingMeetings,
                                deanApprovalLink: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
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
                      บันทึก
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
