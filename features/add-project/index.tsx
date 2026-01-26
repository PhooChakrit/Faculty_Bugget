"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Collaborator, FormData, Notes } from "./types";

// Import Sections
import { BasicInfoSection } from "./components/sections/BasicInfoSection";
import { ReceiptInfoSection } from "./components/sections/ReceiptInfoSection";
import { ClassificationsSection } from "./components/sections/ClassificationsSection";
import { ProjectDetailsSection } from "./components/sections/ProjectDetailsSection";
import { BudgetAndNotesSection } from "./components/sections/BudgetAndNotesSection";

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

export default function AddProjectPage() {
  const [formData, setFormData] = useState<FormData>({
    receiptNumber: "",
    projectNameThai: "",
    projectNameEng: "",
    leaderName: "",
    leaderPosition: "",
    department: "",
    leaderEmail: "",
    startDate: "",
    endDate: "",
    background: "",
    projectDetails: "",
    objectives: "",
    scope: "",
    implementationPlan: "",
    serviceType: "",
    targetGroups: [],
    strategies: [],
    participantCount: "",
    venue: "",
    committee: "",
    expectedBenefits: "",
    budgetSourceExtGov: "",
    budgetSourceExtPrivate: "",
    budgetSourceExtForeign: "",
    budgetSourceInternal: "",
    incomeSupport: "",
    incomeRegistration: "",
    expenseRemuneration: "",
    expenseSupplies: "",
    expenseMaterials: "",
    expenseUtilities: "",
    expenseSubsidy: "",
    expenseReserve: "",
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 1, name: "" },
  ]);

  const [notes, setNotes] = useState<Notes>({
    note1: false,
    note2: false,
    note3: false,
    note4: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", {
      formData,
      collaborators,
      notes,
    });
    alert("บันทึกข้อมูลสำเร็จ!");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-8">
            แบบฟอร์มโครงการบริการวิชาการ
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ReceiptInfoSection
              formData={formData}
              handleChange={handleInputChange}
            />

            <BasicInfoSection
              formData={formData}
              handleChange={handleInputChange}
              setFormData={setFormData}
              departmentOptions={departmentOptions}
              collaborators={collaborators}
              setCollaborators={setCollaborators}
            />

            <ClassificationsSection
              formData={formData}
              setFormData={setFormData}
              serviceTypeOptions={serviceTypeOptions}
              targetGroupOptions={targetGroupOptions}
              strategyOptions={strategyOptions}
            />

            <ProjectDetailsSection
              formData={formData}
              handleChange={handleInputChange}
            />

            <BudgetAndNotesSection
              formData={formData}
              handleChange={handleInputChange}
              notes={notes}
              setNotes={setNotes}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline">
                ยกเลิก
              </Button>
              <Button type="submit">บันทึกข้อมูล</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
