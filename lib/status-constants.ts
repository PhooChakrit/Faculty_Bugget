export enum StatusCode {
  DRAFT = "DRAFT",
  STATUS_0 = "STATUS_0",
  STATUS_1 = "STATUS_1",
  STATUS_2 = "STATUS_2",
  STATUS_3 = "STATUS_3",
  STATUS_4 = "STATUS_4",
  STATUS_5 = "STATUS_5",
  STATUS_6 = "STATUS_6",
  STATUS_7 = "STATUS_7",
  STATUS_8 = "STATUS_8",
  STATUS_9 = "STATUS_9",
  STATUS_10 = "STATUS_10",
  STATUS_11 = "STATUS_11",
  STATUS_12 = "STATUS_12",
  STATUS_13 = "STATUS_13",
  STATUS_14 = "STATUS_14",
  STATUS_15 = "STATUS_15",
  RECALL = "RECALL",
  STATUS_99 = "STATUS_99",
}

export const statusLabels: Record<StatusCode, string> = {
  [StatusCode.DRAFT]: "แบบร่างโครงการ",
  [StatusCode.STATUS_0]: "รอหัวหน้าภาคอนุมัติส่งงานวิจัย",
  [StatusCode.STATUS_1]:
    "งานบริหารวิจัยและบริการวิชาการ ดำเนินการตรวจสอบ/แก้ไข",
  [StatusCode.STATUS_2]:
    "งานบริหารวิจัยและบริการวิชาการ ตรวจสอบ/แก้ไข เรียบร้อยแล้ว",
  [StatusCode.STATUS_3]:
    "งานบริหารวิจัยและบริการวิชาการเสนอเข้าที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์",
  [StatusCode.STATUS_4]:
    "มติที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์อนุมัติ และให้เสนองานบริหารวิจัยและบริการวิชาการเพื่อดำเนินการต่อไป",
  [StatusCode.STATUS_5]:
    "มติที่ประชุมคณะกรรมการการบริหารคณะวิทยาศาสตร์เห็นชอบ และให้เสนอกลุ่มภารกิจการประชุม ศูนย์บริหารกลางเพื่อดำเนินการต่อไป",
  [StatusCode.STATUS_6]: "เสนอคณบดี เพื่อพิจารณาอนุมัติโครงการ",
  [StatusCode.STATUS_7]:
    "เสนอต่อที่ประชุมคณบดีแก่คณะวิทยาศาสตร์ เพื่อพิจารณาทักท้วง",
  [StatusCode.STATUS_8]: "คณบดีอนุมัติโครงการ (ระหว่างดำเนินโครงการ)",
  [StatusCode.STATUS_9]:
    "มติคณบดีอนุมัติและเสนอคณะวิทยาศาสตร์ (ระหว่างดำเนินโครงการ)",
  [StatusCode.STATUS_10]: "จัดส่งรายงานผลการดำเนินโครงการแล้ว",
  [StatusCode.STATUS_11]: "(Deprecated) ยกเลิกสถานะนี้ตามมติที่ประชุม",
  [StatusCode.STATUS_12]:
    "(Legacy) ภาควิชาจัดส่งรายงานการดำเนินโครงการเรียบร้อยแล้ว",
  [StatusCode.STATUS_13]: "ปิดโครงการ",
  [StatusCode.STATUS_14]: "ระงับโครงการ",
  [StatusCode.STATUS_15]: "อื่นๆ",
  [StatusCode.RECALL]: "ดึงกลับเอกสาร",
  [StatusCode.STATUS_99]: "ขอแก้ไขการเงิน",
};

export const statusColors: Record<StatusCode, string> = {
  [StatusCode.DRAFT]: "bg-slate-100 text-slate-800 border-slate-300",
  [StatusCode.STATUS_0]: "bg-amber-100 text-amber-800 border-amber-300",
  [StatusCode.STATUS_1]: "bg-yellow-100 text-yellow-800 border-yellow-300",
  [StatusCode.STATUS_2]: "bg-blue-100 text-blue-800 border-blue-300",
  [StatusCode.STATUS_3]: "bg-indigo-100 text-indigo-800 border-indigo-300",
  [StatusCode.STATUS_4]: "bg-purple-100 text-purple-800 border-purple-300",
  [StatusCode.STATUS_5]: "bg-purple-100 text-purple-800 border-purple-300",
  [StatusCode.STATUS_6]: "bg-violet-100 text-violet-800 border-violet-300",
  [StatusCode.STATUS_7]: "bg-violet-100 text-violet-800 border-violet-300",
  [StatusCode.STATUS_8]: "bg-green-100 text-green-800 border-green-300",
  [StatusCode.STATUS_9]: "bg-green-100 text-green-800 border-green-300",
  [StatusCode.STATUS_10]: "bg-cyan-100 text-cyan-800 border-cyan-300",
  [StatusCode.STATUS_11]: "bg-orange-100 text-orange-800 border-orange-300",
  [StatusCode.STATUS_12]: "bg-lime-100 text-lime-800 border-lime-300",
  [StatusCode.STATUS_13]: "bg-emerald-100 text-emerald-800 border-emerald-300",
  [StatusCode.STATUS_14]: "bg-red-100 text-red-800 border-red-300",
  [StatusCode.STATUS_15]: "bg-gray-100 text-gray-800 border-gray-300",
  [StatusCode.RECALL]: "bg-red-100 text-red-800 border-red-300",
  [StatusCode.STATUS_99]: "bg-orange-100 text-orange-800 border-orange-300",
};

export function getStatusBadge(code: string | null | undefined): {
  label: string;
  className: string;
} {
  const key = (code ?? "") as StatusCode;
  const label = statusLabels[key] ?? code ?? "-";
  const className =
    statusColors[key] ?? "bg-slate-100 text-slate-700 border-slate-300";
  return { label, className };
}

export interface AllowedStatusTransition {
  fromStatus: StatusCode;
  toStatus: StatusCode;
  label: string;
  condition?: string;
  order?: number;
}

export const allowedTransitions: AllowedStatusTransition[] = [
  // Draft
  {
    fromStatus: StatusCode.DRAFT,
    toStatus: StatusCode.STATUS_0,
    label: "ส่งหัวหน้าภาคพิจารณา",
    condition: "DEPT_HEAD_APPROVAL_REQUIRED",
    order: 1,
  },

  // From STATUS_0
  {
    fromStatus: StatusCode.STATUS_0,
    toStatus: StatusCode.STATUS_1,
    label: "หัวหน้าภาคอนุมัติส่งงานวิจัย",
    order: 1,
  },

  // From STATUS_1
  {
    fromStatus: StatusCode.STATUS_1,
    toStatus: StatusCode.STATUS_2,
    label: "ตรวจสอบเรียบร้อย",
    order: 1,
  },
  {
    fromStatus: StatusCode.STATUS_1,
    toStatus: StatusCode.RECALL,
    label: "ร้องขอดึงกลับ",
    condition: "DEPT_ONLY",
    order: 2,
  },

  // From RECALL
  {
    fromStatus: StatusCode.RECALL,
    toStatus: StatusCode.DRAFT,
    label: "อนุมัติดึงกลับ",
    condition: "STAFF_ONLY",
    order: 1,
  },

  // From STATUS_2
  {
    fromStatus: StatusCode.STATUS_2,
    toStatus: StatusCode.STATUS_1,
    label: "ส่งกลับแก้ไข",
    order: 1,
  },
  {
    fromStatus: StatusCode.STATUS_2,
    toStatus: StatusCode.STATUS_3,
    label: "เสนอคณะกรรมการ",
    order: 2,
  },

  // From STATUS_3 (Branch point)
  {
    fromStatus: StatusCode.STATUS_3,
    toStatus: StatusCode.STATUS_4,
    label: "มติอนุมัติ",
    order: 1,
  },
  {
    fromStatus: StatusCode.STATUS_3,
    toStatus: StatusCode.STATUS_5,
    label: "มติเห็นชอบ",
    order: 2,
  },

  // Path A: Approval route (4->6->8->10)
  {
    fromStatus: StatusCode.STATUS_4,
    toStatus: StatusCode.STATUS_6,
    label: "เสนอคณบดี",
    order: 1,
  },
  {
    fromStatus: StatusCode.STATUS_6,
    toStatus: StatusCode.STATUS_8,
    label: "คณบดีอนุมัติ",
    order: 1,
  },
  {
    fromStatus: StatusCode.STATUS_8,
    toStatus: StatusCode.STATUS_10,
    label: "อัปโหลดรายงานผลการดำเนินโครงการ",
    condition: "REPORT_UPLOADED",
    order: 1,
  },

  // Path B: Endorsement route (5->7->9->10)
  {
    fromStatus: StatusCode.STATUS_5,
    toStatus: StatusCode.STATUS_7,
    label: "เสนอประชุมคณบดี",
    order: 1,
  },
  {
    fromStatus: StatusCode.STATUS_7,
    toStatus: StatusCode.STATUS_9,
    label: "มติอนุมัติ",
    order: 1,
  },
  {
    fromStatus: StatusCode.STATUS_9,
    toStatus: StatusCode.STATUS_10,
    label: "อัปโหลดรายงานผลการดำเนินโครงการ",
    condition: "REPORT_UPLOADED",
    order: 1,
  },

  // STATUS_10 is terminal for the active workflow.
];

export enum NotificationType {
  DEPT_HEAD = "DEPT_HEAD",
  FINANCE = "FINANCE",
  PLANNING = "PLANNING",
  PHYSICAL = "PHYSICAL",
}

export const notificationLabels: Record<NotificationType, string> = {
  [NotificationType.DEPT_HEAD]: "แจ้งหัวหน้าภาควิชา",
  [NotificationType.FINANCE]: "แจ้งสายการเงินและบัญชี",
  [NotificationType.PLANNING]: "แจ้งงานนโยบายและแผน",
  [NotificationType.PHYSICAL]: "แจ้งงานบริหารกายภาพ",
};

export const notificationIcons: Record<NotificationType, string> = {
  [NotificationType.DEPT_HEAD]: "👤",
  [NotificationType.FINANCE]: "💰",
  [NotificationType.PLANNING]: "📋",
  [NotificationType.PHYSICAL]: "🏢",
};
