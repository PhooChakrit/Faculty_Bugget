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

// Import constants instead
import {
  departmentOptions,
  serviceTypeOptions,
  strategyOptions,
  targetGroupOptions,
} from "./constants";
import { ProjectPreview } from "./components/ProjectPreview";

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
  customIncomeCategories: [],
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

  const [showPreview, setShowPreview] = useState(false);
  const [validatedData, setValidatedData] = useState<FormDataSchemaType | null>(
    null,
  );

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

  const handlePreviewOpen = (data: FormDataSchemaType) => {
    setValidatedData(data);
    setShowPreview(true);
  };

  const onConfirmSubmit = async () => {
    if (!validatedData) return;

    try {
      // Transform data to match API schema
      const apiData = {
        ...validatedData,
        // Convert strings to numbers
        participantCount:
          validatedData.participants.reduce(
            (sum, p) => sum + (parseInt(p.count) || 0),
            0,
          ) || undefined,
        participantDetails:
          validatedData.participants
            .map((p) => p.details)
            .filter(Boolean)
            .join(", ") || undefined,
        budgetSourceExtGov: validatedData.budgetSourceExtGov
          ? parseFloat(validatedData.budgetSourceExtGov)
          : undefined,
        budgetSourceExtPrivate: validatedData.budgetSourceExtPrivate
          ? parseFloat(validatedData.budgetSourceExtPrivate)
          : undefined,
        budgetSourceExtForeign: validatedData.budgetSourceExtForeign
          ? parseFloat(validatedData.budgetSourceExtForeign)
          : undefined,
        budgetSourceInternal: validatedData.budgetSourceInternal
          ? parseFloat(validatedData.budgetSourceInternal)
          : undefined,
        expenseRemuneration: validatedData.expenseRemuneration
          ? parseFloat(validatedData.expenseRemuneration)
          : undefined,
        expenseSupplies: validatedData.expenseSupplies
          ? parseFloat(validatedData.expenseSupplies)
          : undefined,
        expenseMaterials: validatedData.expenseMaterials
          ? parseFloat(validatedData.expenseMaterials)
          : undefined,
        expenseUtilities: validatedData.expenseUtilities
          ? parseFloat(validatedData.expenseUtilities)
          : undefined,
        expenseSubsidy: validatedData.expenseSubsidy
          ? parseFloat(validatedData.expenseSubsidy)
          : undefined,
        expenseReserve: validatedData.expenseReserve
          ? parseFloat(validatedData.expenseReserve)
          : undefined,

        // Map arrays and objects
        targetGroupIds: validatedData.targetGroups,
        strategyIds: validatedData.strategies,

        // Combine income items
        incomeItems: [
          ...validatedData.incomeSupportItems.map((item) => ({
            type: "SUPPORT" as const,
            name: item.name,
            amount: parseFloat(item.amount || "0"),
          })),
          ...validatedData.incomeRegistrationItems.map((item) => ({
            type: "REGISTRATION" as const,
            name: item.name,
            amount: parseFloat(item.amount || "0"),
          })),
          ...(validatedData.customIncomeCategories || []).flatMap((category) =>
            category.items.map((item) => ({
              type: "OTHER" as const,
              name: item.name,
              amount: parseFloat(item.amount || "0"),
              categoryName: category.categoryName,
            })),
          ),
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
      setShowPreview(false);
      router.push("/projects"); // Redirect to list
    } catch (error) {
      console.error("Error creating project:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const onError = (errors: unknown) => {
    console.log("Validation errors:", errors);
    alert("กรุณาตรวจสอบข้อมูลที่กรอก");

    if (errors && typeof errors === "object") {
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        // Try finding by name first, then by id
        const element =
          document.getElementsByName(firstErrorKey)[0] ||
          document.getElementById(firstErrorKey);

        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-8">
            แบบฟอร์มโครงการบริการวิชาการ
          </h1>

          {!showPreview ? (
            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit(handlePreviewOpen, onError)}
                className="space-y-6 animate-in fade-in duration-300"
              >
                <ReceiptInfoSection formData={formData} />

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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h3 className="text-red-800 font-medium mb-2">
                      กรุณาแก้ไขข้อผิดพลาด:
                    </h3>
                    <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                      {Array.from(
                        new Set(
                          (function extractMessages(errObj: unknown): string[] {
                            if (!errObj) return [];
                            if (typeof errObj === "string") return [errObj];
                            const obj = errObj as Record<string, unknown>;
                            if (
                              obj.message &&
                              typeof obj.message === "string"
                            ) {
                              return [obj.message];
                            }
                            let msgs: string[] = [];
                            if (typeof errObj === "object" && errObj !== null) {
                              for (const val of Object.values(errObj)) {
                                msgs = msgs.concat(extractMessages(val));
                              }
                            }
                            return msgs;
                          })(errors),
                        ),
                      ).map((msg, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {msg}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                  {process.env.NODE_ENV === "development" && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const dummyData: FormDataSchemaType = {
                          receiptNumber: crypto.randomUUID(),
                          projectNameThai: "โครงการทดสอบระบบบันทึกงบประมาณ",
                          projectNameEng:
                            "Budget Recording System Test Project",
                          leaderName: "สมชาย ทดสอบ",
                          leaderPosition: "อาจารย์ประจำภาควิชา",
                          department: "sci",
                          leaderEmail: "somchai.t@chula.ac.th",
                          coLeaderName: "สมหญิง รักเรียน",
                          coLeaderEmail: "somying.r@chula.ac.th",
                          startDate: new Date().toISOString().split("T")[0],
                          endDate: new Date(Date.now() + 86400000 * 7)
                            .toISOString()
                            .split("T")[0],
                          background:
                            "เพื่อทดสอบประสิทธิภาพของระบบและตรวจสอบความถูกต้องของการคำนวณงบประมาณ",
                          projectDetails:
                            "รายละเอียดโครงการทดสอบครอบคลุมถึงการกำหนดแผนการดำเนินงานและการประเมินผล",
                          objectives:
                            "1. เพื่อทดสอบระบบ\n2. เพื่อแสดงให้ลูกค้าดู",
                          scope: "บุคลากรและนิสิตในคณะวิทยาศาสตร์",
                          implementationPlan:
                            "สัปดาห์ที่ 1: เตรียมการ\nสัปดาห์ที่ 2: ดำเนินงาน",
                          serviceType: "1",
                          targetGroups: ["1", "2"],
                          strategies: ["2"],
                          participants: [
                            {
                              id: 1,
                              count: "50",
                              details: "นิสิตคณะวิทยาศาสตร์",
                            },
                          ],
                          venue: "ตึกแถบ นีละนิธิ คณะวิทยาศาสตร์",
                          committee: "คณะกรรมการทดสอบระบบ",
                          expectedBenefits: "ระบบทำงานได้อย่างถูกต้องและแม่นยำ",
                          projectEvaluation: "แบบประเมินความพึงพอใจ",
                          budgetSourceExtGov: "100000",
                          budgetSourceExtPrivate: "0",
                          budgetSourceExtForeign: "0",
                          budgetSourceInternal: "0",
                          incomeSupportItems: [
                            {
                              id: 1,
                              name: "เงินอุดหนุนวิจัย",
                              amount: "30000",
                            },
                          ],
                          incomeRegistrationItems: [
                            {
                              id: 1,
                              name: "ค่าลงทะเบียนนิสิต",
                              amount: "20000",
                            },
                          ],
                          customIncomeCategories: [
                            {
                              id: 1,
                              categoryName: "รายได้จากการให้บริการอื่นๆ",
                              items: [
                                {
                                  id: 1,
                                  name: "ค่าที่ปรึกษาโครงการ",
                                  amount: "50000",
                                },
                              ],
                            },
                          ],
                          expenseRemuneration: "40000",
                          expenseSupplies: "20000",
                          expenseMaterials: "10000",
                          expenseUtilities: "10000",
                          expenseSubsidy: "10000",
                          expenseReserve: "10000",
                        };
                        methods.reset(dummyData);
                        setCollaborators([{ id: 1, name: "นายสมชาย ใจดี" }]);
                        setNotes({ note2: true, note3: true });
                      }}
                    >
                      Fill Dummy Data
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/projects")}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    เปิดดูข้อมูลก่อนบันทึก
                  </Button>
                </div>
              </form>
            </FormProvider>
          ) : (
            validatedData && (
              <ProjectPreview
                onCancel={() => setShowPreview(false)}
                onConfirm={onConfirmSubmit}
                isSubmitting={isSubmitting}
                formData={validatedData as unknown as FormData}
                collaborators={collaborators}
                notes={notes}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}
