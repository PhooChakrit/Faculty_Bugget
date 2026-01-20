"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Collaborator, Manager, FormData, Notes } from "../add-project/types";

// Import Sections
import { BasicInfoSection } from "./components/sections/BasicInfoSection";
import { CollaboratorsSection } from "./components/sections/CollaboratorsSection";
import { ManagersSection } from "./components/sections/ManagersSection";
import { DatesVenueSection } from "./components/sections/DatesVenueSection";
import { ProjectDetailsSection } from "./components/sections/ProjectDetailsSection";
import { ClassificationsSection } from "./components/sections/ClassificationsSection";
import { BudgetSourcesSection } from "./components/sections/BudgetSourcesSection";
import { BudgetTableSection } from "./components/sections/BudgetTableSection";
import { NotesSection } from "./components/sections/NotesSection";

// Options for dropdowns
const departmentOptions = [
  { value: "sci", label: "ภาควิชาวิทยาศาสตร์" },
  { value: "chem", label: "ภาควิชาเคมี" },
  { value: "bio", label: "ภาควิชาชีววิทยา" },
  { value: "phy", label: "ภาควิชาฟิสิกส์" },
  { value: "math", label: "ภาควิชาคณิตศาสตร์" },
];

const serviceTypeOptions = [
  { value: "1", label: "อภิปราย บรรยาย อบรม ประชุม สัมมนา" },
  { value: "2", label: "ออกแบบ ประดิษฐ์ วางแผน วางระบบ เขียน แปล" },
  { value: "3", label: "CONSULT ทางวิชาการ เทคนิค วิชาชีพ" },
  { value: "4", label: "วิเคราะห์ ทดสอบ ตรวจสอบ" },
  { value: "5", label: "งานบริการทางวิชาการลักษณะอื่น" },
  { value: "6", label: "งานให้บริการทางการแพทย์และสาธารณสุข" },
];

const targetGroupOptions = [
  { value: "1", label: "ประชาคมจุฬาฯ" },
  { value: "2", label: "ชุมชน" },
  { value: "3", label: "หน่วยงานภายนอกภาครัฐ" },
  { value: "4", label: "หน่วยงานภายนอกภาคเอกชน/อุตสาหกรรม" },
];

const strategyOptions = [
  { value: "0", label: "ไม่สอดคล้องกับยุทธศาสตร์ใด ๆ" },
  { value: "1", label: "INTERNATIONAL GROWTH" },
  { value: "2", label: "IMPACTFUL GROWTH" },
  { value: "3", label: "INTERNAL GROWTH" },
  { value: "4", label: "INTEGRATED GROWTH" },
  { value: "5", label: "สอดคล้องกับยุทธศาสตร์ส่วนงาน" },
];

export default function ViewProjectPage() {
  const [formData, setFormData] = useState<FormData>({
    receiptNumber: "วจบ-2026-001",
    projectNameThai: "โครงการอบรมเชิงปฏิบัติการด้านวิทยาศาสตร์สำหรับนิสิต",
    projectNameEng: "Science Workshop Training Program for Students",
    leaderName: "ผศ.ดร.สมชาย ใจดี",
    leaderPosition: "อาจารย์ประจำภาควิชา",
    department: "sci",
    leaderEmail: "somchai.j@chula.ac.th",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    background:
      "เนื่องจากนิสิตต้องการความรู้เพิ่มเติมในการทำวิจัย และต้องการทักษะในการใช้เครื่องมือทางวิทยาศาสตร์",
    projectDetails:
      "จัดอบรมเชิงปฏิบัติการเกี่ยวกับการใช้เครื่องมือวิทยาศาสตร์ขั้นสูง พร้อมให้คำแนะนำจากผู้เชี่ยวชาญ",
    objectives:
      "1. เพื่อพัฒนาทักษะการทำวิจัยของนิสิต\n2. เพื่อให้นิสิตได้เรียนรู้การใช้เครื่องมือทางวิทยาศาสตร์\n3. เพื่อส่งเสริมการเรียนรู้แบบปฏิบัติ",
    scope: "นิสิตคณะวิทยาศาสตร์ชั้นปีที่ 3-4 จำนวน 50 คน",
    implementationPlan:
      "สัปดาห์ที่ 1-2: เตรียมการและประชาสัมพันธ์\nสัปดาห์ที่ 3-4: ดำเนินการอบรม",
    serviceType: "1",
    targetGroups: ["1"],
    strategies: ["2", "3"],
    participantCount: "50",
    venue: "ห้องปฏิบัติการวิทยาศาสตร์ ชั้น 5 อาคาร SC",
    committee: "คณะกรรมการวิชาการคณะวิทยาศาสตร์",
    expectedBenefits:
      "นิสิตได้รับความรู้และทักษะในการใช้เครื่องมือวิทยาศาสตร์ สามารถนำไปประยุกต์ใช้ในการทำวิจัยได้",
    budgetSourceExtGov: "50000",
    budgetSourceExtPrivate: "30000",
    budgetSourceExtForeign: "0",
    budgetSourceInternal: "20000",
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 1, name: "ภาควิชาเคมี" },
    { id: 2, name: "ศูนย์เครื่องมือวิทยาศาสตร์" },
  ]);

  const [managers, setManagers] = useState<Manager[]>([
    { id: 1, name: "ดร.วิภา สุขใจ", position: "ผู้จัดการโครงการ" },
    { id: 2, name: "อ.สมศรี ดีมาก", position: "ผู้ประสานงาน" },
  ]);

  const [notes, setNotes] = useState<Notes>({
    note1: false,
    note2: true,
    note3: false,
    note4: true,
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold">รายละเอียดโครงการ</h1>
            <div className="flex gap-2">
              <Button variant="outline">แก้ไข</Button>
              <Button variant="outline">พิมพ์</Button>
            </div>
          </div>

          <div className="space-y-6">
            <BasicInfoSection
              formData={formData}
              departmentOptions={departmentOptions}
            />

            <CollaboratorsSection collaborators={collaborators} />

            <ManagersSection managers={managers} />

            <DatesVenueSection formData={formData} />

            <ProjectDetailsSection formData={formData} />

            <ClassificationsSection
              formData={formData}
              serviceTypeOptions={serviceTypeOptions}
              targetGroupOptions={targetGroupOptions}
              strategyOptions={strategyOptions}
            />

            <BudgetSourcesSection formData={formData} />

            <BudgetTableSection />

            <NotesSection notes={notes} />
          </div>
        </div>
      </main>
    </div>
  );
}
