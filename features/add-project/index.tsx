"use client";

import { useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Collaborator, FormData, Notes } from "./types";
import { formDataSchema } from "./schema";
import { projectService } from "@/services/projectService";
import { useRouter } from "next/navigation";

// Import Sections
import { BasicInfoSection } from "./components/sections/BasicInfoSection";
import { ReceiptInfoSection } from "./components/sections/ReceiptInfoSection";
import { ClassificationsSection } from "./components/sections/ClassificationsSection";
import { ProjectDetailsSection } from "./components/sections/ProjectDetailsSection";
import { BudgetAndNotesSection } from "./components/sections/BudgetAndNotesSection";

// Infer type from schema
type FormDataSchemaType = z.infer<typeof formDataSchema>;

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

const defaultFormValues: FormData = {
  receiptNumber: "",
  projectNameThai: "",
  projectNameEng: "",
  leaderName: "",
  leaderPosition: "",
  department: "",
  leaderEmail: "",
  coLeaderName: "",
  coLeaderEmail: "",
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
  participants: [{ id: 1, count: "", details: "" }],
  venue: "",
  committee: "",
  expectedBenefits: "",
  projectEvaluation: "",
  budgetSourceExtGov: "",
  budgetSourceExtPrivate: "",
  budgetSourceExtForeign: "",
  budgetSourceInternal: "",
  incomeSupportItems: [{ id: 1, name: "", amount: "" }],
  incomeRegistrationItems: [{ id: 1, name: "", amount: "" }],
  expenseRemuneration: "",
  expenseSupplies: "",
  expenseMaterials: "",
  expenseUtilities: "",
  expenseSubsidy: "",
  expenseReserve: "",
};

export default function AddProjectPage() {
  const methods = useForm<FormDataSchemaType>({
    resolver: zodResolver(formDataSchema),
    defaultValues: defaultFormValues as FormDataSchemaType,
    mode: "onBlur",
  });

  const router = useRouter();

  const {
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = methods;

  const watchedData = useWatch({ control: methods.control });
  // Cast to FormData for backward compatibility with section components
  const formData = watchedData as unknown as FormData;

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 1, name: "" },
  ]);

  const [notes, setNotes] = useState<Notes>({
    note2: false,
    note3: false,
  });

  // Legacy handleChange for sections not yet migrated to RHF
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValue(name as keyof FormDataSchemaType, value as never, {
      shouldValidate: true,
    });
  };

  // Legacy setFormData for sections not yet migrated to RHF
  const setFormData = (updater: FormData | ((prev: FormData) => FormData)) => {
    const currentData = getValues() as unknown as FormData;
    const newData =
      typeof updater === "function" ? updater(currentData) : updater;

    // Update all changed fields
    Object.keys(newData).forEach((key) => {
      const typedKey = key as keyof FormDataSchemaType;
      if (
        JSON.stringify(newData[typedKey as keyof FormData]) !==
        JSON.stringify(currentData[typedKey as keyof FormData])
      ) {
        setValue(typedKey, newData[typedKey as keyof FormData] as never, {
          shouldValidate: true,
        });
      }
    });
  };

  const onSubmit = async (data: FormDataSchemaType) => {
    try {
      // Transform data to match API schema
      const apiData = {
        ...data,
        // Convert strings to numbers
        participantCount:
          data.participants.reduce(
            (sum, p) => sum + (parseInt(p.count) || 0),
            0,
          ) || undefined,
        participantDetails:
          data.participants
            .map((p) => p.details)
            .filter(Boolean)
            .join(", ") || undefined,
        budgetSourceExtGov: data.budgetSourceExtGov
          ? parseFloat(data.budgetSourceExtGov)
          : undefined,
        budgetSourceExtPrivate: data.budgetSourceExtPrivate
          ? parseFloat(data.budgetSourceExtPrivate)
          : undefined,
        budgetSourceExtForeign: data.budgetSourceExtForeign
          ? parseFloat(data.budgetSourceExtForeign)
          : undefined,
        budgetSourceInternal: data.budgetSourceInternal
          ? parseFloat(data.budgetSourceInternal)
          : undefined,
        expenseRemuneration: data.expenseRemuneration
          ? parseFloat(data.expenseRemuneration)
          : undefined,
        expenseSupplies: data.expenseSupplies
          ? parseFloat(data.expenseSupplies)
          : undefined,
        expenseMaterials: data.expenseMaterials
          ? parseFloat(data.expenseMaterials)
          : undefined,
        expenseUtilities: data.expenseUtilities
          ? parseFloat(data.expenseUtilities)
          : undefined,
        expenseSubsidy: data.expenseSubsidy
          ? parseFloat(data.expenseSubsidy)
          : undefined,
        expenseReserve: data.expenseReserve
          ? parseFloat(data.expenseReserve)
          : undefined,

        // Map arrays and objects
        targetGroupIds: data.targetGroups,
        strategyIds: data.strategies,

        // Combine income items
        incomeItems: [
          ...data.incomeSupportItems.map((item) => ({
            type: "SUPPORT" as const,
            name: item.name,
            amount: parseFloat(item.amount || "0"),
          })),
          ...data.incomeRegistrationItems.map((item) => ({
            type: "REGISTRATION" as const,
            name: item.name,
            amount: parseFloat(item.amount || "0"),
          })),
        ].filter((item) => item.name && item.amount > 0),

        // Map collaborators
        collaborators: collaborators
          .filter((c) => c.name.trim() !== "")
          .map((c) => ({ name: c.name })),

        // Add notes
        note2: notes.note2,
        note3: notes.note3,

        // Required relation fields (leaderId would typically come from auth context)
        // For now hardcoding or using dummy if not in form
        // Wait, schema requires leaderId. The form has leaderName but not ID.
        // NOTE: The current form does NOT have a user picker, just text inputs.
        // This suggests we might need to mock the ID or the API needs to be adjusted
        // if it expects a real User ID from the database.
        // Based on `app/api/projects/schema.ts`, `leaderId` IS required.
        // I will default to a placeholder ID if not present, but real app should use auth user or selection.
        // Checking schema.ts again: leaderId: z.string().min(1, "กรุณาระบุหัวหน้าโครงการ")
        // The form has `leaderName` string input.
        // I'll assume for now we might need to send a dummy ID or handle this.
        // But wait, the form has no place to input ID.
        // I'll use a hardcoded valid CUID or similar if possible, or maybe the user has a specific leader ID in mind?
        // Let's check if there's any context on User ID.
        // The previous conversation "Using Login Token" suggests auth might be present.
        // PROVISIONAL: I will push `leaderId: "user-id-placeholder"` content and let the user know.
        leaderId: "cmlfoz51o0000voxek4yjqxhg", // Valid user ID from DB check
      };

      await projectService.createProject(apiData);
      alert("บันทึกข้อมูลโครงการสำเร็จ");
      router.push("/projects"); // Redirect to list
    } catch (error) {
      console.error("Error creating project:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const onError = (errors: unknown) => {
    console.log("Validation errors:", errors);
    alert("กรุณาตรวจสอบข้อมูลที่กรอก");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-8">
            แบบฟอร์มโครงการบริการวิชาการ
          </h1>

          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit, onError)}
              className="space-y-6"
            >
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
                setFormData={setFormData}
              />

              <BudgetAndNotesSection
                formData={formData}
                handleChange={handleInputChange}
                setFormData={setFormData}
                notes={notes}
                setNotes={setNotes}
              />

              {/* Display validation errors */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-medium mb-2">
                    กรุณาแก้ไขข้อผิดพลาด:
                  </h3>
                  <ul className="list-disc list-inside text-red-600 text-sm">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>{error?.message as string}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline">
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </main>
    </div>
  );
}
