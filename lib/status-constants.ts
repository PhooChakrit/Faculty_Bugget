export enum StatusCode {
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
}

export const statusLabels: Record<StatusCode, string> = {
  [StatusCode.STATUS_0]: "แบบร่าง (ยังไม่ส่งเข้ากระบวนการ)",
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
  [StatusCode.STATUS_8]: "คณบดีอนุมัติโครงการ",
  [StatusCode.STATUS_9]: "มติคณบดีอนุมัติและเสนอคณะวิทยาศาสตร์",
  [StatusCode.STATUS_10]:
    "รองคณบดีดำเนินการแจ้ง (หัวหน้าภาควิชา และหน่วยงานที่เกี่ยวข้อง)",
  [StatusCode.STATUS_11]:
    "รอภาควิชาจัดส่งรายงานการดำเนินโครงการ (ภายใน 15 วัน)",
  [StatusCode.STATUS_12]: "ภาควิชาจัดส่งรายงานการดำเนินโครงการเรียบร้อยแล้ว",
  [StatusCode.STATUS_13]: "ปิดโครงการ",
  [StatusCode.STATUS_14]: "ระงับโครงการ",
  [StatusCode.STATUS_15]: "อื่นๆ",
  [StatusCode.RECALL]: "ดึงกลับเอกสาร",
};

export const statusColors: Record<StatusCode, string> = {
  [StatusCode.STATUS_0]: "bg-slate-100 text-slate-700 border-slate-300",
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
};

export interface AllowedStatusTransition {
  fromStatus: StatusCode;
  toStatus: StatusCode;
  label: string;
  condition?: string;
  order?: number;
}

export const allowedTransitions: AllowedStatusTransition[] = [
  // From STATUS_0 (draft — ยังไม่เข้าขั้นตอนงานบริหาร)
  {
    fromStatus: StatusCode.STATUS_0,
    toStatus: StatusCode.STATUS_1,
    label: "ส่งเข้ากระบวนการ",
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
    toStatus: StatusCode.STATUS_1,
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
    label: "รองคณบดีดำเนินการแจ้ง",
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
    label: "รองคณบดีดำเนินการแจ้ง",
    order: 1,
  },

  // From STATUS_10 (Notification Phase)
  {
    fromStatus: StatusCode.STATUS_10,
    toStatus: StatusCode.STATUS_11,
    label: "รอรายงาน",
    condition: "ALL_NOTIFICATIONS_COMPLETE",
    order: 1,
  },

  // Final stages
  {
    fromStatus: StatusCode.STATUS_11,
    toStatus: StatusCode.STATUS_12,
    label: "รับรายงานแล้ว",
    order: 1,
  },
  {
    fromStatus: StatusCode.STATUS_12,
    toStatus: StatusCode.STATUS_13,
    label: "ปิดโครงการ",
    order: 1,
  },

  // To suspended status
  {
    fromStatus: StatusCode.STATUS_11,
    toStatus: StatusCode.STATUS_14,
    label: "ระงับโครงการ",
    order: 2,
  },
  {
    fromStatus: StatusCode.STATUS_12,
    toStatus: StatusCode.STATUS_14,
    label: "ระงับโครงการ",
    order: 2,
  },

  // To Others status (available from early stages)
  {
    fromStatus: StatusCode.STATUS_1,
    toStatus: StatusCode.STATUS_15,
    label: "อื่นๆ",
    order: 3,
  },
  {
    fromStatus: StatusCode.STATUS_2,
    toStatus: StatusCode.STATUS_15,
    label: "อื่นๆ",
    order: 3,
  },
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
