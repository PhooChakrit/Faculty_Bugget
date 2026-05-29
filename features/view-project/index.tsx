"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Collaborator, FormData, Notes, Manager } from "../add-project/types";
import { formatStatusDisplay } from "@/lib/status-constants";
import { mockActorByRole, mockActors, type ActorRole } from "@/lib/mock-actors";

// Import Sections
import { ReceiptInfoSection } from "./components/sections/ReceiptInfoSection";
import { BasicInfoSection } from "./components/sections/BasicInfoSection";
import { ClassificationsSection } from "./components/sections/ClassificationsSection";
import { ProjectDetailsSection } from "./components/sections/ProjectDetailsSection";
import { BudgetAndNotesSection } from "./components/sections/BudgetAndNotesSection";

import { ManagersSection } from "./components/sections/ManagersSection";

// ... options remain ...

type WorkflowAction =
  | "SUBMIT_DRAFT"
  | "DEPT_APPROVE"
  | "MARK_INTERNAL_REVIEW_CHECKED"
  | "COMPLETE_RESEARCH_REVIEW"
  | "APPROVE_TO_BOARD"
  | "RELEASE_BOARD_PROJECT"
  | "RELEASE_DEAN_PROJECT"
  | "CLOSE_PROJECT";

type MeetingFormState = {
  id?: string;
  type: "BOARD" | "DEAN";
  no: string;
  date: string;
  purpose: string;
  decisionStatusCode: "" | "STATUS_4" | "STATUS_5";
  deanApprovalLink: string;
};

type ProjectRecord = {
  id: string;
  currentStatusCode?: string | null;
  status1?: string | null;
  projectCode?: string | null;
  memoTitle?: string | null;
  projectNameThai?: string | null;
  docLink?: string | null;
  vendorCode?: string | null;
  costCenter?: string | null;
  costCenterFileName?: string | null;
  currentStatus?: {
    notes?: string | null;
    actionLogs?: Array<{
      id: string;
      actionType: string;
      actorRole: string;
      note?: string | null;
      createdAt: string;
      actorUser?: { name?: string | null } | null;
    }>;
  } | null;
  meetings?: Array<{
    id: string;
    type: "BOARD" | "DEAN";
    no: string;
    date: string;
    purpose?: string | null;
    decisionStatusCode?: string | null;
  }>;
  roleCompletions?: Array<{ role: string; isComplete: boolean }>;
  budgetRevisions?: Array<{
    id: string;
    status: string;
    reason: string;
    closeAfterApproval: boolean;
  }>;
  [key: string]: unknown;
};

export default function ViewProjectPage({ projectId }: ViewProjectPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [projectData, setProjectData] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ActorRole>("USER");
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: WorkflowAction;
    label: string;
  } | null>(null);
  const [meetingForm, setMeetingForm] = useState<MeetingFormState | null>(null);
  const [savingMeeting, setSavingMeeting] = useState(false);

  // Lookup data / relations
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [notes, setNotes] = useState<Notes>({
    note2: false,
    note3: false,
  });

  const currentActor = mockActorByRole[userRole];

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

        setProjectData(project as ProjectRecord);

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
          participants: [
            {
              id: 1,
              count: project.participantCount?.toString() || "",
              details: project.participantDetails || "",
            },
          ],
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

          customIncomeCategories: Object.values(
            project.incomeItems
              .filter((i: { type: string }) => i.type === "OTHER")
              .reduce(
                (
                  acc: Record<
                    string,
                    {
                      id: number;
                      categoryName: string;
                      items: { id: string; name: string; amount: string }[];
                    }
                  >,
                  item: {
                    type: string;
                    categoryName?: string;
                    id: string;
                    name: string;
                    amount: number;
                  },
                ) => {
                  const catName = item.categoryName || "หมวดหมู่อื่นๆ";
                  if (!acc[catName]) {
                    acc[catName] = {
                      id: Date.now() + Math.random(),
                      categoryName: catName,
                      items: [],
                    };
                  }
                  acc[catName].items.push({
                    id: item.id,
                    name: item.name,
                    amount: item.amount.toString(),
                  });
                  return acc;
                },
                {} as Record<
                  string,
                  {
                    id: number;
                    categoryName: string;
                    items: { id: string; name: string; amount: string }[];
                  }
                >,
              ),
          ),

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

  const statusCode = projectData?.currentStatusCode ?? "DRAFT";
  const isInternalReviewChecked = Boolean(
    projectData?.currentStatus?.notes?.includes("INTERNAL_REVIEW_CHECKED"),
  );
  const activeBudgetRevision = projectData?.budgetRevisions?.[0] ?? null;
  const roleCompletion = (role: string) =>
    projectData?.roleCompletions?.find((item) => item.role === role)
      ?.isComplete ?? false;
  const canReleaseBoard = Boolean(
    projectData?.vendorCode &&
      (projectData?.costCenter || projectData?.costCenterFileName),
  );
  const canReleaseDean = Boolean(canReleaseBoard && projectData?.docLink);
  const canCloseProject = Boolean(
    projectData?.docLink &&
      roleCompletion("RESEARCH") &&
      roleCompletion("PHYSICAL") &&
      roleCompletion("FINANCE"),
  );
  const statusDetailText = useMemo(() => {
    if (statusCode === "DRAFT") {
      return "เจ้าของโครงการจัดทำและตรวจสอบข้อมูลก่อนยื่นเสนอหัวหน้าภาควิชา";
    }
    if (statusCode === "STATUS_0") {
      return "รอหัวหน้าภาควิชาพิจารณาอนุมัติส่งต่อฝ่ายวิจัย";
    }
    if (statusCode === "STATUS_1") {
      return isInternalReviewChecked
        ? "ฝ่ายวิจัยตรวจสอบข้อมูลเรียบร้อยแล้ว รอส่งเสนอรองคณบดีฝ่ายวิจัย"
        : "ฝ่ายวิจัยตรวจสอบและแก้ไขข้อมูลโครงการ";
    }
    if (statusCode === "STATUS_2") {
      return "รอรองคณบดีฝ่ายวิจัยพิจารณาอนุมัติเสนอคณะกรรมการบริหารคณะวิทยาศาสตร์";
    }
    if (statusCode === "STATUS_3") {
      return "ฝ่ายวิจัยบันทึกมติคณะกรรมการบริหารคณะวิทยาศาสตร์และเลือกเส้นทางดำเนินการ";
    }
    if (statusCode === "STATUS_4") {
      return "รอข้อมูลหลังมติ ได้แก่ รหัสเจ้าหนี้และศูนย์ต้นทุน ก่อนอนุมัติให้ดำเนินโครงการ";
    }
    if (statusCode === "STATUS_5") {
      return "รอข้อมูลหลังมติคณบดี ได้แก่ รหัสเจ้าหนี้ ศูนย์ต้นทุน และเอกสารอนุมัติคณบดี";
    }
    if (statusCode === "STATUS_6" || statusCode === "STATUS_7") {
      return "โครงการได้รับอนุมัติให้ดำเนินการ รอรายงานและการยืนยันข้อมูลเพื่อปิดโครงการ";
    }
    if (statusCode === "STATUS_8") {
      return "ปิดโครงการแล้ว";
    }
    return "ติดตามข้อมูลตามสถานะปัจจุบัน";
  }, [isInternalReviewChecked, statusCode]);
  const canShowMeetingSection = [
    "STATUS_3",
    "STATUS_4",
    "STATUS_5",
    "STATUS_6",
    "STATUS_7",
    "STATUS_8",
  ].includes(statusCode);
  const visibleMeetings = useMemo(() => {
    const meetings = projectData?.meetings ?? [];
    if (!canShowMeetingSection) return [];
    if (statusCode === "STATUS_3" || statusCode === "STATUS_4" || statusCode === "STATUS_6") {
      return meetings.filter((meeting) => meeting.type === "BOARD");
    }
    return meetings;
  }, [canShowMeetingSection, projectData?.meetings, statusCode]);
  const canShowCompletionSection =
    statusCode === "STATUS_6" || statusCode === "STATUS_7";
  const canShowBudgetRevisionSection =
    Boolean(activeBudgetRevision) &&
    (statusCode === "STATUS_6" || statusCode === "STATUS_7");
  const workflowActions = useMemo(() => {
    const actions: Array<{
      action: WorkflowAction;
      label: string;
      role: ActorRole;
      disabled?: boolean;
      reason?: string;
    }> = [];
    if (statusCode === "DRAFT") {
      actions.push({
        action: "SUBMIT_DRAFT",
        label: "ยื่นเสนอหัวหน้าภาควิชา",
        role: "USER",
      });
    } else if (statusCode === "STATUS_0") {
      actions.push({
        action: "DEPT_APPROVE",
        label: "อนุมัติส่งฝ่ายวิจัย",
        role: "ภาควิชาวิทยาศาสตร์",
      });
    } else if (statusCode === "STATUS_1") {
      actions.push(
        isInternalReviewChecked
          ? {
              action: "COMPLETE_RESEARCH_REVIEW",
              label: "เสนอรองคณบดีฝ่ายวิจัย",
              role: "งานวิจัย",
            }
          : {
              action: "MARK_INTERNAL_REVIEW_CHECKED",
              label: "ตรวจสอบข้อมูลแล้ว",
              role: "งานวิจัย",
            },
      );
    } else if (statusCode === "STATUS_2") {
      actions.push({
        action: "APPROVE_TO_BOARD",
        label: "อนุมัติเสนอคณะกรรมการฯ",
        role: "หัวหน้าฝ่ายวิจัย",
      });
    } else if (statusCode === "STATUS_4") {
      actions.push({
        action: "RELEASE_BOARD_PROJECT",
        label: "อนุมัติโครงการให้ดำเนินการ",
        role: "งานวิจัย",
        disabled: !canReleaseBoard,
        reason: "ต้องมีรหัสเจ้าหนี้และศูนย์ต้นทุนก่อน",
      });
    } else if (statusCode === "STATUS_5") {
      actions.push({
        action: "RELEASE_DEAN_PROJECT",
        label: "อนุมัติโครงการให้ดำเนินการ",
        role: "งานวิจัย",
        disabled: !canReleaseDean,
        reason: "ต้องมีรหัสเจ้าหนี้ ศูนย์ต้นทุน และเอกสารคณบดีก่อน",
      });
    } else if (statusCode === "STATUS_6" || statusCode === "STATUS_7") {
      actions.push({
        action: "CLOSE_PROJECT",
        label: "ปิดโครงการ",
        role: "งานคลัง",
        disabled: !canCloseProject,
        reason: "ต้องมีรายงานและการยืนยันจากฝ่ายวิจัย งานกายภาพ และงานคลัง",
      });
    }
    return actions;
  }, [
    canCloseProject,
    canReleaseBoard,
    canReleaseDean,
    isInternalReviewChecked,
    statusCode,
  ]);

  const runStatusAction = async (action: WorkflowAction) => {
    if (!projectData) return;
    setSavingAction(action);
    try {
      const response = await fetch(`/api/overviews/${projectData.id}/status-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          actorRole: userRole,
          actorUserId: currentActor.id,
        }),
      });
      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error ?? "ดำเนินการสถานะไม่สำเร็จ");
      }
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingAction(null);
      setPendingAction(null);
    }
  };

  const saveMeeting = async () => {
    if (!projectData || !meetingForm) return;
    setSavingMeeting(true);
    try {
      const response = await fetch(`/api/overviews/${projectData.id}/meetings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetings: [
            {
              id: meetingForm.id,
              type: meetingForm.type,
              no: meetingForm.no,
              date: meetingForm.date,
              purpose: meetingForm.purpose,
              decisionStatusCode: meetingForm.decisionStatusCode || null,
            },
          ],
          deanApprovalLink: meetingForm.deanApprovalLink,
          actorRole: userRole,
          actorUserId: currentActor.id,
        }),
      });
      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error ?? "บันทึกมติไม่สำเร็จ");
      }
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingMeeting(false);
    }
  };

  const toggleCompletion = async (role: "RESEARCH" | "PHYSICAL" | "FINANCE") => {
    if (!projectData) return;
    setSavingAction(`COMPLETION_${role}`);
    try {
      const response = await fetch(`/api/overviews/${projectData.id}/completion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          isComplete: !roleCompletion(role),
          actorRole: userRole,
          actorUserId: currentActor.id,
        }),
      });
      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error ?? "บันทึกการยืนยันไม่สำเร็จ");
      }
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingAction(null);
    }
  };

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
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/projects")}
              className="h-10 w-10 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-2xl font-semibold">
              ข้อมูลโครงการบริการวิชาการ
            </h1>
          </div>

          {projectData && (
            <Card className="mb-6 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    สถานะโครงการ
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {formatStatusDisplay(statusCode)}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    รหัสโครงการ: {projectData.projectCode?.trim() || "-"}
                  </div>
                </div>
                <select
                  value={userRole}
                  onChange={(event) =>
                    setUserRole(event.target.value as ActorRole)
                  }
                  className="h-10 min-w-72 rounded border border-slate-200 bg-white px-3 text-sm"
                >
                  {mockActors.map((actor) => (
                    <option key={actor.id} value={actor.role}>
                      {actor.role} - {actor.name.replace(" (Mock)", "")}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-6">
            {projectData && (
              <Card className="order-last space-y-4 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    รายละเอียดการดำเนินการตามสถานะ
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    {statusDetailText}
                  </div>
                </div>

                {statusCode === "STATUS_3" && userRole === "งานวิจัย" && (
                  <Button
                    onClick={() =>
                      setMeetingForm({
                        type: "BOARD",
                        no: "",
                        date: "",
                        purpose: "",
                        decisionStatusCode: "STATUS_4",
                        deanApprovalLink: projectData.docLink || "",
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    บันทึกมติคณะกรรมการฯ
                  </Button>
                )}

                {statusCode === "STATUS_5" && userRole === "งานวิจัย" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setMeetingForm({
                        type: "DEAN",
                        no: "",
                        date: "",
                        purpose: "",
                        decisionStatusCode: "",
                        deanApprovalLink: projectData.docLink || "",
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    บันทึกมติ/เอกสารคณบดี
                  </Button>
                )}

                <div className="flex flex-wrap gap-2">
                  {workflowActions
                    .filter((action) => action.role === userRole)
                    .map((action) => (
                      <Button
                        key={action.action}
                        disabled={Boolean(action.disabled) || savingAction === action.action}
                        title={action.reason}
                        onClick={() =>
                          setPendingAction({
                            action: action.action,
                            label: action.label,
                          })
                        }
                      >
                        {savingAction === action.action && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {action.label}
                      </Button>
                    ))}
                </div>

                {canShowCompletionSection && (
                  <div className="grid gap-2 text-sm md:grid-cols-3">
                    {["RESEARCH", "PHYSICAL", "FINANCE"].map((role) => (
                      <div
                        key={role}
                        className="space-y-2 rounded border border-slate-200 bg-slate-50 p-2"
                      >
                        <div>
                          {role === "RESEARCH"
                            ? "ฝ่ายวิจัย"
                            : role === "PHYSICAL"
                              ? "งานกายภาพ"
                              : "งานคลัง"}{" "}
                          :{" "}
                          {roleCompletion(role)
                            ? "ยืนยันแล้ว"
                            : "ยังไม่ยืนยัน"}
                        </div>
                        {((role === "RESEARCH" && userRole === "งานวิจัย") ||
                          (role === "PHYSICAL" && userRole === "กายภาพ") ||
                          (role === "FINANCE" && userRole === "งานคลัง")) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingAction === `COMPLETION_${role}`}
                            onClick={() =>
                              toggleCompletion(
                                role as "RESEARCH" | "PHYSICAL" | "FINANCE",
                              )
                            }
                          >
                            {roleCompletion(role)
                              ? "ยกเลิกการยืนยัน"
                              : "ยืนยันข้อมูล"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {canShowBudgetRevisionSection && activeBudgetRevision && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    คำขอแก้ไขงบประมาณ: {activeBudgetRevision.status} -{" "}
                    {activeBudgetRevision.reason}
                  </div>
                )}

                {canShowMeetingSection && (
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">
                      ประวัติมติที่เกี่ยวข้องกับสถานะนี้
                    </div>
                    <div className="space-y-2">
                      {visibleMeetings.length === 0 ? (
                        <div className="text-sm text-slate-500">
                          ยังไม่มีข้อมูลมติสำหรับสถานะนี้
                        </div>
                      ) : (
                        visibleMeetings.map((meeting) => (
                          <div
                            key={meeting.id}
                            className="flex items-start justify-between gap-3 rounded border border-slate-200 p-3 text-sm"
                          >
                            <div>
                              <div className="font-semibold">
                                {meeting.type === "BOARD"
                                  ? "มติคณะกรรมการบริหารคณะวิทยาศาสตร์"
                                  : "มติคณบดี"}{" "}
                                ครั้งที่ {meeting.no}
                              </div>
                              <div className="text-slate-500">
                                {new Date(meeting.date).toLocaleDateString(
                                  "th-TH",
                                )}
                              </div>
                              <div>{meeting.purpose || "-"}</div>
                              {meeting.decisionStatusCode && (
                                <div className="mt-1 text-indigo-700">
                                  ผลมติ:{" "}
                                  {formatStatusDisplay(
                                    meeting.decisionStatusCode,
                                  )}
                                </div>
                              )}
                            </div>
                            {userRole === "งานวิจัย" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={Boolean(meeting.decisionStatusCode)}
                                title={
                                  meeting.decisionStatusCode
                                    ? "ไม่สามารถลบมติที่ใช้เปลี่ยนสถานะแล้ว"
                                    : "ลบมติ"
                                }
                                onClick={async () => {
                                  const response = await fetch(
                                    `/api/overviews/${projectData.id}/meetings`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        meetingId: meeting.id,
                                        actorRole: userRole,
                                        actorUserId: currentActor.id,
                                      }),
                                    },
                                  );
                                  if (!response.ok) {
                                    const data = await response
                                      .json()
                                      .catch(() => null);
                                    alert(data?.error ?? "ลบมติไม่สำเร็จ");
                                    return;
                                  }
                                  window.location.reload();
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            <ReceiptInfoSection
              projectId={projectId}
              projectCode={projectData?.projectCode}
            />

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

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !savingAction) setPendingAction(null);
        }}
        title="ยืนยันการทำรายการ"
        description={
          pendingAction
            ? `ต้องการทำรายการ "${pendingAction.label}" สำหรับโครงการนี้หรือไม่`
            : ""
        }
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        variant={pendingAction?.action === "CLOSE_PROJECT" ? "destructive" : "default"}
        loading={Boolean(savingAction)}
        onConfirm={() => {
          if (pendingAction) runStatusAction(pendingAction.action);
        }}
      />

      {meetingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <Card className="w-full max-w-xl space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">บันทึกมติที่ประชุม</h2>
              <Button
                variant="ghost"
                onClick={() => setMeetingForm(null)}
                disabled={savingMeeting}
              >
                ปิด
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">ประเภทมติ</label>
                <select
                  value={meetingForm.type}
                  onChange={(event) =>
                    setMeetingForm({
                      ...meetingForm,
                      type: event.target.value as "BOARD" | "DEAN",
                    })
                  }
                  className="h-9 w-full rounded border border-slate-200 px-3 text-sm"
                >
                  <option value="BOARD">
                    มติคณะกรรมการบริหารคณะวิทยาศาสตร์
                  </option>
                  <option value="DEAN">มติคณบดี</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">ครั้งที่</label>
                <Input
                  value={meetingForm.no}
                  onChange={(event) =>
                    setMeetingForm({ ...meetingForm, no: event.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">วันที่</label>
                <Input
                  type="date"
                  value={meetingForm.date}
                  onChange={(event) =>
                    setMeetingForm({ ...meetingForm, date: event.target.value })
                  }
                />
              </div>
              {statusCode === "STATUS_3" && meetingForm.type === "BOARD" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">ผลมติ</label>
                  <select
                    value={meetingForm.decisionStatusCode}
                    onChange={(event) =>
                      setMeetingForm({
                        ...meetingForm,
                        decisionStatusCode: event.target.value as
                          | "STATUS_4"
                          | "STATUS_5",
                      })
                    }
                    className="h-9 w-full rounded border border-slate-200 px-3 text-sm"
                  >
                    <option value="STATUS_4">เสนอคณบดีเพื่อพิจารณา</option>
                    <option value="STATUS_5">
                      เสนอที่ประชุมคณบดีแก่คณะวิทยาศาสตร์
                    </option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                มติ/ข้อสั่งการ
              </label>
              <textarea
                value={meetingForm.purpose}
                onChange={(event) =>
                  setMeetingForm({
                    ...meetingForm,
                    purpose: event.target.value,
                  })
                }
                className="min-h-24 w-full rounded border border-slate-200 p-2 text-sm"
              />
            </div>

            {meetingForm.type === "DEAN" && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  เอกสาร/ลิงก์อนุมัติคณบดี
                </label>
                <Input
                  value={meetingForm.deanApprovalLink}
                  onChange={(event) =>
                    setMeetingForm({
                      ...meetingForm,
                      deanApprovalLink: event.target.value,
                    })
                  }
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMeetingForm(null)}
                disabled={savingMeeting}
              >
                ยกเลิก
              </Button>
              <Button onClick={saveMeeting} disabled={savingMeeting}>
                {savingMeeting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                บันทึก
              </Button>
            </div>
          </Card>
        </div>
      )}
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
