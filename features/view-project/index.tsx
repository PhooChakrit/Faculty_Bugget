"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Collaborator, FormData, Notes, Manager } from "../add-project/types";

// Import Sections
import { ReceiptInfoSection } from "./components/sections/ReceiptInfoSection";
import { BasicInfoSection } from "./components/sections/BasicInfoSection";
import { ClassificationsSection } from "./components/sections/ClassificationsSection";
import { ProjectDetailsSection } from "./components/sections/ProjectDetailsSection";
import { BudgetAndNotesSection } from "./components/sections/BudgetAndNotesSection";

import { ManagersSection } from "./components/sections/ManagersSection";

// ... options remain ...

export default function ViewProjectPage({ projectId }: ViewProjectPageProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lookup data / relations
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [notes, setNotes] = useState<Notes>({
    note2: false,
    note3: false,
  });

  useEffect(() => {
    // If no projectId, we fetch the latest one. No early return needed.

    const fetchProject = async () => {
      try {
        setLoading(true);
        const { projectService } = await import("@/services/projectService");

        let project;
        if (projectId) {
          project = await projectService.getProject(projectId);
        } else {
          project = await projectService.getLatestProject();
        }

        if (!project) {
          setError("ไม่พบข้อมูลโครงการ");
          setLoading(false);
          return;
        }

        // Transform API response to FormData
        const mappedData: FormData = {
          // ... previous fields ...
          receiptNumber: project.receiptNumber || "",
          projectNameThai: project.projectNameThai,
          projectNameEng: project.projectNameEng || "",
          leaderName: project.leader?.name || "",
          leaderPosition: project.leaderPosition,
          department: project.department,
          leaderEmail: project.leader?.email || "",
          coLeaderName: project.coLeader?.name || "",
          coLeaderEmail: project.coLeader?.email || "",
          startDate: project.startDate?.split("T")[0] || "",
          endDate: project.endDate?.split("T")[0] || "",
          background: project.background || "",
          projectDetails: project.projectDetails || "",
          objectives: project.objectives || "",
          scope: project.scope || "",
          implementationPlan: project.implementationPlan || "",
          serviceType: project.serviceType || "",
          targetGroups:
            project.targetGroups?.map(
              (tg: { targetGroupId: string }) => tg.targetGroupId,
            ) || [],
          strategies:
            project.strategies?.map(
              (s: { strategyId: string }) => s.strategyId,
            ) || [],
          participantCount: project.participantCount?.toString() || "",
          participantDetails: project.participantDetails || "",
          venue: project.venue || "",
          committee: project.committee || "",
          expectedBenefits: project.expectedBenefits || "",
          projectEvaluation: project.projectEvaluation || "",

          budgetSourceExtGov: project.budgetSourceExtGov?.toString() || "",
          budgetSourceExtPrivate:
            project.budgetSourceExtPrivate?.toString() || "",
          budgetSourceExtForeign:
            project.budgetSourceExtForeign?.toString() || "",
          budgetSourceInternal: project.budgetSourceInternal?.toString() || "",

          incomeSupportItems: project.incomeItems
            .filter((i: { type: string }) => i.type === "SUPPORT")
            .map((i: { id: string; name: string; amount: number }) => ({
              id: i.id,
              name: i.name,
              amount: i.amount.toString(),
            })),

          incomeRegistrationItems: project.incomeItems
            .filter((i: { type: string }) => i.type === "REGISTRATION")
            .map((i: { id: string; name: string; amount: number }) => ({
              id: i.id,
              name: i.name,
              amount: i.amount.toString(),
            })),

          expenseRemuneration: project.expenseRemuneration?.toString() || "",
          expenseSupplies: project.expenseSupplies?.toString() || "",
          expenseMaterials: project.expenseMaterials?.toString() || "",
          expenseUtilities: project.expenseUtilities?.toString() || "",
          expenseSubsidy: project.expenseSubsidy?.toString() || "",
          expenseReserve: project.expenseReserve?.toString() || "",
        };

        setFormData(mappedData);
        setCollaborators(project.collaborators || []);
        setManagers(project.managers || []);
        setNotes({
          note2: project.note2,
          note3: project.note3,
        });
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError("ไม่สามารถโหลดข้อมูลโครงการได้");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) return <div className="p-8">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!projectId && !formData)
    return <div className="p-8">ไม่พบรหัสโครงการ (Project ID)</div>;
  if (!formData) return <div className="p-8">ไม่พบข้อมูลโครงการ</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold">
              ข้อมูลโครงการบริการวิชาการ
            </h1>
            <div className="flex gap-2">
              <Button variant="outline">แก้ไข</Button>
              <Button variant="outline">พิมพ์</Button>
            </div>
          </div>

          <div className="space-y-6">
            <ReceiptInfoSection formData={formData} />

            <BasicInfoSection
              formData={formData}
              departmentOptions={departmentOptions}
              collaborators={collaborators}
            />

            <ManagersSection managers={managers} />

            <ClassificationsSection
              formData={formData}
              serviceTypeOptions={serviceTypeOptions}
              targetGroupOptions={targetGroupOptions}
              strategyOptions={strategyOptions}
            />

            <ProjectDetailsSection formData={formData} />

            <BudgetAndNotesSection formData={formData} notes={notes} />
          </div>
        </div>
      </main>
    </div>
  );
}
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

interface ViewProjectPageProps {
  projectId?: string;
}
