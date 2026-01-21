"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

// Mock user role - can be changed to test different permissions
const MOCK_USER_ROLE: UserRole = "กายภาพ";

type UserRole = "ภาควิชา" | "งานวิจัย" | "งานแผน" | "งานคลัง" | "กายภาพ";

type ProjectData = {
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
  academicDevelopmentFund: string;
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
  amountUniversityRevenue: string;
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
  documentNumber: string;
  documentDate: string;
  documentLink: string;
};

// Permission matrix: [canView, canEdit]
const PERMISSIONS: Record<UserRole, Record<string, { view: boolean; edit: boolean }>> = {
  ภาควิชา: {
    boardMeetingNo: { view: true, edit: false },
    boardMeetingDate: { view: true, edit: false },
    deanDecisionNo: { view: true, edit: false },
    deanDecisionDate: { view: true, edit: false },
    vendorCode: { view: true, edit: false },
    costCenter: { view: true, edit: false },
    maintenanceFee: { view: true, edit: false },
    electricityFee: { view: true, edit: false },
  },
  งานวิจัย: {
    boardMeetingNo: { view: false, edit: false },
    boardMeetingDate: { view: false, edit: false },
    deanDecisionNo: { view: false, edit: false },
    deanDecisionDate: { view: false, edit: false },
    vendorCode: { view: true, edit: false },
    costCenter: { view: true, edit: false },
    maintenanceFee: { view: true, edit: false },
    electricityFee: { view: true, edit: false },
  },
  งานแผน: {
    boardMeetingNo: { view: true, edit: true },
    boardMeetingDate: { view: true, edit: true },
    deanDecisionNo: { view: true, edit: true },
    deanDecisionDate: { view: true, edit: true },
    vendorCode: { view: false, edit: false },
    costCenter: { view: true, edit: true },
    maintenanceFee: { view: true, edit: false },
    electricityFee: { view: true, edit: false },
  },
  งานคลัง: {
    boardMeetingNo: { view: true, edit: false },
    boardMeetingDate: { view: true, edit: false },
    deanDecisionNo: { view: true, edit: false },
    deanDecisionDate: { view: true, edit: false },
    vendorCode: { view: false, edit: true },
    costCenter: { view: false, edit: false },
    maintenanceFee: { view: false, edit: false },
    electricityFee: { view: false, edit: false },
  },
  กายภาพ: {
    boardMeetingNo: { view: true, edit: false },
    boardMeetingDate: { view: true, edit: false },
    deanDecisionNo: { view: true, edit: false },
    deanDecisionDate: { view: true, edit: false },
    vendorCode: { view: true, edit: false },
    costCenter: { view: true, edit: false },
    maintenanceFee: { view: false, edit: true },
    electricityFee: { view: false, edit: true },
  },
};

// Mock data
const mockProjects: ProjectData[] = [
  {
    id: "1",
    receiptNumber: "2827/2568, 3367/2568",
    projectCode: "ACS001-69",
    boardMeetingNo: "17/2568",
    boardMeetingDate: "8 กันยายน 2568",
    deanDecisionNo: "16/2568",
    deanDecisionDate: "24 กันยายน 2568",
    purpose: "ขอความเห็นชอบจัดโครงการ",
    memoTitle: "โครงการบริการวิชาการ การจัดการเรียนการสอนรายวิชาสุขภาพและความงาม",
    department: "ภาควิชาชีวเคมี",
    projectHead: "รองศาสตราจารย์ xxxxx",
    totalBudget: "xxxxx",
    compensation: "xxxx",
    operatingCost: "-",
    materialCost: "-",
    utilities: "xxxx",
    academicDevelopmentFund: "xxxx",
    generalReserve: "-",
    startDate: "1 กรกฏคม 2568",
    endDate: "30 พฤศจิิกายน 2568",
    fundOwner: "สถาบันการพยาบาลศรี xxxx xx",
    vendorCode: "3014106",
    serviceType: "06.งานบริการทางวิชาการลักษณะอื่น",
    strategyType: "04.INTERNAL GROWTH",
    targetGroup: "10.หน่วยงานภายนอกภาครัฐ, หน่วยงานภายนอกภาคเอกชน/อุตสาหกรรม",
    participantCount: "60",
    projectDescription: "การจัดการเรียนการสอนในรายวิชาสุขภาพและความงาม",
    amountGovExternal: "35,348.00",
    amountPrivateExternal: "",
    amountForeignExternal: "",
    amountUniversityRevenue: "",
    status1: "inner คณะ",
    status1Date: "3/9/2025",
    status2: "ออกจากบอร์ด",
    status2Date: "9/9/2025",
    status3: "ส่งไป ศหก",
    status3Date: "11/9/2025",
    status4: "",
    status4Date: "",
    status5: "",
    status5Date: "",
    responsible: "",
    documentNumber: "",
    documentDate: "",
    documentLink: "",
  },
];

export default function OverviewsPage() {
  const [projects, setProjects] = useState<ProjectData[]>(mockProjects);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const userRole = MOCK_USER_ROLE;

  const canView = (field: string) => {
    const permission = PERMISSIONS[userRole][field];
    return permission ? permission.view : true; // Default to view if not in permission matrix
  };

  const canEdit = (field: string) => {
    const permission = PERMISSIONS[userRole][field];
    return permission ? permission.edit : false; // Default to no edit if not in permission matrix
  };

  const handleCellClick = (projectId: string, field: string) => {
    if (canEdit(field)) {
      setEditingCell({ id: projectId, field });
    }
  };

  const handleCellChange = (projectId: string, field: keyof ProjectData, value: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, [field]: value } : project
      )
    );
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const renderCell = (project: ProjectData, field: keyof ProjectData, label: string) => {
    const isEditing = editingCell?.id === project.id && editingCell?.field === field;
    const value = project[field];
    const editable = canEdit(field);
    const viewable = canView(field);

    if (!viewable) {
      return <td className="border border-gray-300 px-2 py-1 text-center text-xs">-</td>;
    }

    return (
      <td
        className={`border border-gray-300 px-2 py-1 text-xs ${
          editable ? "cursor-pointer hover:bg-blue-50" : ""
        }`}
        onClick={() => handleCellClick(project.id, field)}
      >
        {isEditing ? (
          <Input
            value={value}
            onChange={(e) => handleCellChange(project.id, field, e.target.value)}
            onBlur={handleCellBlur}
            autoFocus
            className="h-7 text-xs"
          />
        ) : (
          <span className={editable ? "text-blue-600" : ""}>{value || "-"}</span>
        )}
      </td>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">สรุปโครงการบริการวิชาการ</h1>
            <p className="text-sm text-gray-600 mt-1">
              บทบาทปัจจุบัน: <span className="font-semibold text-blue-600">{userRole}</span>
            </p>
          </div>
          <Button>เพิ่มโครงการ</Button>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-300 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      เลขที่รับ วจบ
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      รหัสโครงการ
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      ประชุมบอร์ด ครั้งที่
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      ประชุมบอร์ด วันที่
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      มติคณบดี ครั้งที่
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      มติคณบดี วันที่
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      เพื่อดำเนินการ
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      ชื่อบันทึกข้อความ
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      ภาควิชา/หน่วยงาน
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      หัวหน้าโครงการ
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      งบประมาณรวม
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      รหัสเจ้าหนี้
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      วันเริ่มต้น
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      วันสิ้นสุด
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      สถานะการดำเนินงาน 1
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      วันที่
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      สถานะการดำเนินงาน 2
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      วันที่
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      สถานะการดำเนินงาน 3
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-xs font-semibold">
                      วันที่
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.receiptNumber}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.projectCode}
                      </td>
                      {renderCell(project, "boardMeetingNo", "ประชุมบอร์ด ครั้งที่")}
                      {renderCell(project, "boardMeetingDate", "ประชุมบอร์ด วันที่")}
                      {renderCell(project, "deanDecisionNo", "มติคณบดี ครั้งที่")}
                      {renderCell(project, "deanDecisionDate", "มติคณบดี วันที่")}
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.purpose}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs max-w-xs truncate">
                        {project.memoTitle}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.department}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.projectHead}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs text-right">
                        {project.totalBudget}
                      </td>
                      {renderCell(project, "vendorCode", "รหัสเจ้าหนี้")}
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.startDate}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.endDate}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.status1}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.status1Date}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.status2}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.status2Date}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.status3}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">
                        {project.status3Date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">คำแนะนำ:</h3>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>• คอลัมน์ที่แสดงเป็น <span className="text-blue-600">สีน้ำเงิน</span> สามารถแก้ไขได้</li>
            <li>• คลิกที่เซลล์เพื่อแก้ไข</li>
            <li>• สิทธิ์ในการดูและแก้ไขขึ้นอยู่กับบทบาทของคุณ</li>
            <li>• คอลัมน์ที่แสดง "-" หมายถึงคุณไม่มีสิทธิ์ดูข้อมูล</li>
          </ul>
        </div>
      </Card>
      </div>
    </div>
  );
}
