"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Collaborator, FormData, Notes } from "./types";
import { formDataSchema } from "./schema";
import { projectService } from "@/services/projectService";
import { useRouter, useSearchParams } from "next/navigation";
import { UpdateProjectInput } from "@/app/api/projects/schema";

import {
  DEFAULT_LEADER_ID,
  FormDataSchemaType,
  backupFormToLocalStorage,
  buildApiPayloadFromForm,
  clearPendingDraftSession,
  diffApiPayload,
  ensureDraftProjectId,
  mergeSyncedPayload,
  projectApiToFormState,
  stripEmptyStringValues,
} from "./project-sync";

// Import Sections
import { BasicInfoSection } from "./components/sections/BasicInfoSection";
import { ClassificationsSection } from "./components/sections/ClassificationsSection";
import { ProjectDetailsSection } from "./components/sections/ProjectDetailsSection";
import { BudgetAndNotesSection } from "./components/sections/BudgetAndNotesSection";

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

function AddProjectContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const router = useRouter();

  const methods = useForm<FormDataSchemaType>({
    resolver: zodResolver(formDataSchema),
    defaultValues: defaultFormValues as FormDataSchemaType,
    mode: "onBlur",
  });

  const {
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = methods;

  const watchedData = useWatch({ control: methods.control });
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

  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const lastSyncedRef = useRef<Record<string, unknown> | null>(null);
  const leaderIdRef = useRef(DEFAULT_LEADER_ID);
  /** Set when a draft is created lazily so the load effect skips form reset */
  const justCreatedDraftRef = useRef<string | null>(null);

  /**
   * Unified effect:
   * - No projectId → check if user has an existing draft with real data.
   *   If yes → redirect to it. If no → show blank form immediately.
   * - Has projectId → load project data into form.
   *   If the id was just created by lazy autosave → skip form reset (keep what user typed).
   */
  useEffect(() => {
    if (!projectId) {
      setHydrated(false);
      setLoadError(null);
      let cancelled = false;
      (async () => {
        try {
          const existing = await projectService.findExistingDraft(
            DEFAULT_LEADER_ID,
          );
          if (cancelled) return;
          if (existing?.id) {
            router.replace(`/add-project?id=${existing.id}`);
          } else {
            setHydrated(true);
          }
        } catch {
          if (!cancelled) setHydrated(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    clearPendingDraftSession();

    // Draft was just created by lazy autosave — form already has user's input
    if (justCreatedDraftRef.current === projectId) {
      justCreatedDraftRef.current = null;
      setHydrated(true);
      return;
    }

    let cancelled = false;
    setHydrated(false);
    setLoadError(null);
    (async () => {
      try {
        const p = await projectService.getProject(projectId);
        if (cancelled) return;
        const { form, collaborators: col, notes: n } = projectApiToFormState(p);
        leaderIdRef.current = p.leaderId || DEFAULT_LEADER_ID;
        methods.reset(form);
        setCollaborators(col);
        setNotes(n);
        lastSyncedRef.current = buildApiPayloadFromForm(
          form,
          col,
          n,
          leaderIdRef.current,
        );
        backupFormToLocalStorage(projectId, {
          form,
          collaborators: col,
          notes: n,
        });
        setHydrated(true);
      } catch {
        if (!cancelled) setLoadError("โหลดข้อมูลโครงการไม่สำเร็จ");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, router, methods]);

  /** Debounced autosave (delta PUT). Creates a draft lazily on first save. */
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(async () => {
      try {
        const values = getValues() as FormDataSchemaType;
        const payload = buildApiPayloadFromForm(
          values,
          collaborators,
          notes,
          leaderIdRef.current,
        );
        const diff = diffApiPayload(lastSyncedRef.current, payload);
        const cleaned = stripEmptyStringValues(diff);
        if (Object.keys(cleaned).length === 0) return;

        let currentId = projectId;
        if (!currentId) {
          // First meaningful input — create the draft now
          currentId = await ensureDraftProjectId(leaderIdRef.current);
          justCreatedDraftRef.current = currentId;
          router.replace(`/add-project?id=${currentId}`);
        }

        await projectService.updateProject(
          currentId,
          cleaned as UpdateProjectInput,
        );
        lastSyncedRef.current = mergeSyncedPayload(
          lastSyncedRef.current,
          cleaned,
        );
        backupFormToLocalStorage(currentId, {
          form: values,
          collaborators,
          notes,
        });
      } catch (e) {
        console.error("Autosave failed:", e);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [watchedData, collaborators, notes, projectId, hydrated, getValues, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValue(name as keyof FormDataSchemaType, value as never, {
      shouldValidate: true,
    });
  };

  const setFormData = (updater: FormData | ((prev: FormData) => FormData)) => {
    const currentData = getValues() as unknown as FormData;
    const newData =
      typeof updater === "function" ? updater(currentData) : updater;

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
    if (!validatedData || !projectId) return;

    try {
      const base = buildApiPayloadFromForm(
        validatedData,
        collaborators,
        notes,
        leaderIdRef.current,
      );
      const payload: UpdateProjectInput = {
        ...(base as UpdateProjectInput),
        status: "PENDING_APPROVAL",
        currentStatusCode: "STATUS_1",
      };
      await projectService.updateProject(projectId, payload);
      lastSyncedRef.current = mergeSyncedPayload(lastSyncedRef.current, {
        ...base,
        status: "PENDING_APPROVAL",
        currentStatusCode: "STATUS_1",
      } as Record<string, unknown>);
      alert("บันทึกข้อมูลโครงการสำเร็จ");
      setShowPreview(false);
      router.push("/projects");
    } catch (error) {
      console.error("Error saving project:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const onError = (errs: unknown) => {
    console.log("Validation errors:", errs);
    alert("กรุณาตรวจสอบข้อมูลที่กรอก");

    if (errs && typeof errs === "object") {
      const firstErrorKey = Object.keys(errs)[0];
      if (firstErrorKey) {
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

  const showWait = !hydrated && !loadError;
  const waitMessage = projectId
    ? "กำลังโหลดข้อมูลโครงการ…"
    : "กำลังตรวจสอบแบบร่าง…";

  if (showWait) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-slate-50 flex items-center justify-center">
          <p className="text-slate-600">{waitMessage}</p>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-slate-50 flex flex-col items-center justify-center gap-4">
          <p className="text-red-600">{loadError}</p>
          <Button type="button" onClick={() => router.push("/projects")}>
            กลับไปรายการโครงการ
          </Button>
        </main>
      </div>
    );
  }

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
                {/* <ReceiptInfoSection formData={formData} /> */}

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

                <div className="flex justify-end gap-4 pt-4">
                  {process.env.NODE_ENV === "development" && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const dummyData: FormDataSchemaType = {
                          receiptNumber: "",
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

export default function AddProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8 bg-slate-50 flex items-center justify-center text-slate-600">
            กำลังโหลด…
          </main>
        </div>
      }
    >
      <AddProjectContent />
    </Suspense>
  );
}
