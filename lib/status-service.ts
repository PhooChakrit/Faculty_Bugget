import { prisma } from "./prisma";
import type {
  ClosureRole,
  EmailDeliveryStatus,
  StatusCode,
  NotificationType,
} from "../app/generated/prisma/client";
import { allowedTransitions, statusLabels } from "./status-constants";
import { generateProjectId } from "./generate-project-id";
import { mockActorByRole } from "./mock-actors";

export interface TransitionValidationResult {
  isValid: boolean;
  reason?: string;
  availableTransitions?: Array<{
    toStatus: StatusCode;
    label: string;
    condition?: string;
  }>;
}

export interface NotificationChecklistItem {
  type: NotificationType;
  label: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: { id: string; name: string | null };
}

export interface ClosureProgress {
  researchComplete: boolean;
  physicalComplete: boolean;
  financeComplete: boolean;
  bothComplete: boolean;
}

type RecallReviewDecision = "APPROVE" | "REJECT";

const RECALL_REQUEST_TAG = "RECALL_REQUEST";
const RECALL_APPROVED_PREFIX = "RECALL_APPROVED";
const RECALL_REJECTED_PREFIX = "RECALL_REJECTED";
const SCIENCE_DEPARTMENT_CODE = "sci";
const SCIENCE_DEPARTMENT_LABEL = "ภาควิชาวิทยาศาสตร์";

export class StatusTransitionService {
  async getDepartmentHeadAssignment(projectId: string): Promise<{
    department: string;
    headUserId: string;
  } | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { department: true },
    });

    if (!project) {
      return null;
    }

    const department = project.department?.trim();
    if (!department || department === "-") {
      return null;
    }

    const assignment = await prisma.departmentHeadAssignment.findUnique({
      where: { department },
      select: { headUserId: true },
    });

    if (!assignment) {
      if (department === SCIENCE_DEPARTMENT_CODE) {
        return {
          department,
          headUserId: mockActorByRole[SCIENCE_DEPARTMENT_LABEL].id,
        };
      }

      return null;
    }

    return {
      department,
      headUserId: assignment.headUserId,
    };
  }

  async hasDepartmentHeadAssignment(projectId: string): Promise<boolean> {
    const assignment = await this.getDepartmentHeadAssignment(projectId);
    return Boolean(assignment);
  }

  async isAssignedDepartmentHead(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    const assignment = await this.getDepartmentHeadAssignment(projectId);
    return assignment?.headUserId === userId;
  }

  async getCurrentStatus(
    projectId: string,
  ): Promise<{ currentStatusCode: StatusCode | null } | null> {
    return prisma.project.findUnique({
      where: { id: projectId },
      select: { currentStatusCode: true },
    }) as Promise<{ currentStatusCode: StatusCode | null } | null>;
  }

  /**
   * Get all available transitions from the current status
   */
  async getAvailableTransitions(
    projectId: string,
  ): Promise<
    Array<{ toStatus: StatusCode; label: string; condition?: string }>
  > {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { currentStatusCode: true },
    });

    if (!project || !project.currentStatusCode) {
      return [];
    }

    // Get allowed transitions from constants
    const transitions = allowedTransitions.filter(
      (t) => t.fromStatus === (project.currentStatusCode as StatusCode),
    );

    return transitions.map((t) => ({
      toStatus: t.toStatus,
      label: t.label,
      condition: t.condition,
    }));
  }

  /**
   * Check if a specific transition is valid
   */
  async canTransition(
    projectId: string,
    toStatus: StatusCode,
  ): Promise<TransitionValidationResult> {
    // Get project with current status
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        currentStatus: {
          include: {
            notifications: {
              include: {
                completer: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return {
        isValid: false,
        reason: "โครงการไม่พบในระบบ",
      };
    }

    const currentStatus = project.currentStatusCode;

    if (!currentStatus) {
      return {
        isValid: false,
        reason: "โครงการยังไม่มีสถานะ",
      };
    }

    // Check if transition exists in allowed transitions
    const transition = allowedTransitions.find(
      (t) =>
        t.fromStatus === (currentStatus as StatusCode) &&
        t.toStatus === toStatus,
    );

    if (!transition) {
      // Get available transitions for error message
      const available = await this.getAvailableTransitions(projectId);
      return {
        isValid: false,
        reason: `ไม่สามารถเปลี่ยนจาก ${currentStatus} ไป ${toStatus} ได้`,
        availableTransitions: available,
      };
    }

    if (toStatus === "STATUS_6" || toStatus === "STATUS_7") {
      const hasVendor = Boolean(project.vendorCode?.trim());
      const hasCostCenter = Boolean(
        project.costCenter?.trim() || project.costCenterFileName?.trim(),
      );
      const hasDeanApproval =
        toStatus === "STATUS_6" || Boolean(project.docLink?.trim());

      if (!hasVendor || !hasCostCenter || !hasDeanApproval) {
        return {
          isValid: false,
          reason:
            "ต้องมีรหัสเจ้าหนี้ ไฟล์ศูนย์ต้นทุน และเอกสารอนุมัติคณบดีสำหรับเส้นทางคณบดีก่อนอนุมัติให้ดำเนินโครงการ",
        };
      }
    }

    if (
      (currentStatus === "STATUS_6" || currentStatus === "STATUS_7") &&
      toStatus === "STATUS_8"
    ) {
      const hasReportLink = Boolean(project.docLink?.trim());
      if (!hasReportLink) {
        return {
          isValid: false,
          reason:
            "ต้องแนบลิงก์รายงานผลการดำเนินโครงการ (docLink) ก่อนปิดโครงการ",
        };
      }

      const progress = await this.getClosureProgress(projectId);
      if (!progress.bothComplete) {
        return {
          isValid: false,
          reason:
            "ต้องให้งานวิจัย กายภาพ และงานคลังยืนยันข้อมูลครบก่อนปิดโครงการ",
        };
      }
    }

    if (toStatus === "STATUS_13") {
      return {
        isValid: false,
        reason: "STATUS_13 ถูกยกเลิกสำหรับ workflow ใหม่ กรุณาใช้ STATUS_8",
      };
    }

    if (currentStatus === "STATUS_1" && toStatus === "RECALL") {
      const recallRequest = project.currentStatus?.notifications.find(
        (n) =>
          n.notificationType === "DEPT_HEAD" &&
          n.recipient === RECALL_REQUEST_TAG,
      );

      const isApproved =
        recallRequest?.isCompleted &&
        Boolean(recallRequest.notes?.startsWith(RECALL_APPROVED_PREFIX));

      if (!isApproved) {
        return {
          isValid: false,
          reason: "ต้องผ่านการรับรองคำขอเรียกคืนจากหัวหน้าภาคก่อน",
        };
      }
    }

    return {
      isValid: true,
    };
  }

  /**
   * Execute a status transition
   */
  async transitionStatus(
    projectId: string,
    toStatus: StatusCode,
    userId: string,
    branchChoice?: string,
  ): Promise<{
    success: boolean;
    error?: string;
    statusRecord?: { id: string; statusCode: StatusCode };
  }> {
    // Validate transition
    const validation = await this.canTransition(projectId, toStatus);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.reason,
      };
    }

    // Execute transition in a transaction
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. Close current status record (set exitedAt)
          const project = await tx.project.findUnique({
            where: { id: projectId },
            select: {
              currentStatusId: true,
              currentStatusCode: true,
              projectCode: true,
              submittedAt: true,
            },
          });

          const shouldGenerateProjectCode =
            (toStatus === "STATUS_6" || toStatus === "STATUS_7") &&
            !project?.projectCode;
          const generatedProjectCode = shouldGenerateProjectCode
            ? await generateProjectId(tx)
            : null;

          if (project?.currentStatusId) {
            await tx.projectStatusRecord.update({
              where: { id: project.currentStatusId },
              data: { exitedAt: new Date() },
            });
          }

          // 2. Create new status record
          const newStatusRecord = await tx.projectStatusRecord.create({
            data: {
              projectId,
              statusCode: toStatus,
              statusLabel: statusLabels[toStatus], // Get label from constants
              enteredAt: new Date(),
              enteredBy: userId,
              branchChoice,
            },
          });

          // 3. Update project's current status
          await tx.project.update({
            where: { id: projectId },
            data: {
              currentStatusCode: toStatus,
              currentStatusId: newStatusRecord.id,
              ...(generatedProjectCode && {
                projectCode: generatedProjectCode,
              }),
              draftState: toStatus === "DRAFT" ? "DRAFT" : "SUBMITTED",
              submittedAt:
                toStatus === "DRAFT"
                  ? null
                  : (project?.submittedAt ?? new Date()),
            },
          });

          return newStatusRecord;
        },
        {
          isolationLevel: "Serializable",
        },
      );

      if (toStatus === "STATUS_6" || toStatus === "STATUS_7") {
        await this.sendApprovalEmails(projectId);
      }

      return {
        success: true,
        statusRecord: {
          id: result.id,
          statusCode: result.statusCode,
        },
      };
    } catch (error) {
      console.error("Status transition error:", error);
      return {
        success: false,
        error: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
      };
    }
  }

  /**
   * Create notification tasks when entering STATUS_10
   * Deprecated for new workflow; retained only for compatibility.
   */
  private async createNotifications(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    statusRecordId: string,
  ): Promise<void> {
    const notifications: Array<{
      statusId: string;
      notificationType: NotificationType;
      isRequired: boolean;
      isCompleted: boolean;
    }> = [
      {
        statusId: statusRecordId,
        notificationType: "FINANCE",
        isRequired: false,
        isCompleted: false,
      },
      {
        statusId: statusRecordId,
        notificationType: "PLANNING",
        isRequired: false,
        isCompleted: false,
      },
      {
        statusId: statusRecordId,
        notificationType: "PHYSICAL",
        isRequired: false,
        isCompleted: false,
      },
    ];

    await tx.notificationStatus.createMany({
      data: notifications,
    });
  }

  private async ensureRoleCompletionRows(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any,
    projectId: string,
  ): Promise<void> {
    await tx.projectRoleCompletion.upsert({
      where: {
        projectId_role: {
          projectId,
          role: "RESEARCH",
        },
      },
      update: {
        isComplete: false,
        completedAt: null,
        completedBy: null,
        notes: null,
      },
      create: {
        projectId,
        role: "RESEARCH",
      },
    });

    await tx.projectRoleCompletion.upsert({
      where: {
        projectId_role: {
          projectId,
          role: "PHYSICAL",
        },
      },
      update: {
        isComplete: false,
        completedAt: null,
        completedBy: null,
        notes: null,
      },
      create: {
        projectId,
        role: "PHYSICAL",
      },
    });

    await tx.projectRoleCompletion.upsert({
      where: {
        projectId_role: {
          projectId,
          role: "FINANCE",
        },
      },
      update: {
        isComplete: false,
        completedAt: null,
        completedBy: null,
        notes: null,
      },
      create: {
        projectId,
        role: "FINANCE",
      },
    });
  }

  async getClosureProgress(projectId: string): Promise<ClosureProgress> {
    const rows = await prisma.projectRoleCompletion.findMany({
      where: { projectId },
      select: {
        role: true,
        isComplete: true,
      },
    });

    const researchComplete =
      rows.find((row) => row.role === "RESEARCH")?.isComplete ?? false;
    const physicalComplete =
      rows.find((row) => row.role === "PHYSICAL")?.isComplete ?? false;
    const financeComplete =
      rows.find((row) => row.role === "FINANCE")?.isComplete ?? false;

    return {
      researchComplete,
      physicalComplete,
      financeComplete,
      bothComplete: researchComplete && physicalComplete && financeComplete,
    };
  }

  async setRoleCompletion(
    projectId: string,
    role: ClosureRole,
    isComplete: boolean,
    userId: string,
    notes?: string,
  ): Promise<{ success: boolean; error?: string; progress?: ClosureProgress }> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { currentStatusCode: true },
      });

      if (!project) {
        return { success: false, error: "โครงการไม่พบในระบบ" };
      }

      if (
        project.currentStatusCode !== "STATUS_6" &&
        project.currentStatusCode !== "STATUS_7"
      ) {
        return {
          success: false,
          error: "โครงการต้องอยู่ในสถานะ 6 หรือ 7 (ดำเนินโครงการได้)",
        };
      }

      await prisma.projectRoleCompletion.upsert({
        where: {
          projectId_role: {
            projectId,
            role,
          },
        },
        create: {
          projectId,
          role,
          isComplete,
          completedAt: isComplete ? new Date() : null,
          completedBy: isComplete ? userId : null,
          notes,
        },
        update: {
          isComplete,
          completedAt: isComplete ? new Date() : null,
          completedBy: isComplete ? userId : null,
          notes,
        },
      });

      const progress = await this.getClosureProgress(projectId);

      return {
        success: true,
        progress,
      };
    } catch (error) {
      console.error("Set role completion error:", error);
      return {
        success: false,
        error: "เกิดข้อผิดพลาดในการบันทึกสถานะความครบถ้วน",
      };
    }
  }

  private async sendApprovalEmails(projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        leader: {
          select: { email: true, name: true },
        },
      },
    });

    if (!project) return;

    const recipients: Array<{ email: string; recipientRole: string }> = [];

    if (project.leader.email) {
      recipients.push({
        email: project.leader.email,
        recipientRole: "PROJECT_OWNER",
      });
    }

    const physicalList = (process.env.PHYSICAL_ROLE_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    for (const email of physicalList) {
      recipients.push({
        email,
        recipientRole: "PHYSICAL",
      });
    }

    if (recipients.length === 0) {
      return;
    }

    const subject = `อนุมัติโครงการ ${project.projectCode ?? project.id}`;

    for (const recipient of recipients) {
      const exists = await prisma.approvalEmailLog.findFirst({
        where: {
          projectId,
          recipient: recipient.email,
          status: {
            in: ["SENT", "PENDING"] as EmailDeliveryStatus[],
          },
        },
      });

      if (exists) {
        continue;
      }

      const log = await prisma.approvalEmailLog.create({
        data: {
          projectId,
          recipient: recipient.email,
          recipientRole: recipient.recipientRole,
          subject,
          status: "PENDING",
        },
      });

      await this.dispatchEmail(log.id, recipient.email, subject, project.id);
    }
  }

  private async dispatchEmail(
    logId: string,
    to: string,
    subject: string,
    projectId: string,
  ): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.APPROVAL_EMAIL_FROM;

    if (!resendApiKey || !fromAddress) {
      await prisma.approvalEmailLog.update({
        where: { id: logId },
        data: {
          status: "SKIPPED",
          errorMessage:
            "Missing RESEND_API_KEY or APPROVAL_EMAIL_FROM configuration",
        },
      });
      return;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html: `<p>โครงการ ${projectId} ได้รับอนุมัติและสามารถดำเนินโครงการได้</p>`,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        await prisma.approvalEmailLog.update({
          where: { id: logId },
          data: {
            status: "FAILED",
            errorMessage: errorBody.slice(0, 500),
          },
        });
        return;
      }

      await prisma.approvalEmailLog.update({
        where: { id: logId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (error) {
      await prisma.approvalEmailLog.update({
        where: { id: logId },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  /**
   * Check if all required notifications are complete
   */
  async areAllRequiredNotificationsComplete(
    projectId: string,
  ): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        currentStatus: {
          include: {
            notifications: true,
          },
        },
      },
    });

    if (!project?.currentStatus?.notifications) {
      return false;
    }

    const requiredNotifications = project.currentStatus.notifications.filter(
      (n) => n.isRequired,
    );

    return (
      requiredNotifications.length > 0 &&
      requiredNotifications.every((n) => n.isCompleted)
    );
  }

  /**
   * Get notification checklist for STATUS_10
   */
  async getNotificationChecklist(
    projectId: string,
  ): Promise<NotificationChecklistItem[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        currentStatus: {
          include: {
            notifications: {
              include: {
                completer: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project?.currentStatus?.notifications) {
      return [];
    }

    const notificationLabels: Record<NotificationType, string> = {
      DEPT_HEAD: "10.1 แจ้งหัวหน้าภาควิชา",
      FINANCE: "10.2 แจ้งการเงิน",
      PLANNING: "10.3 แจ้งแผน",
      PHYSICAL: "10.4 แจ้งพัสดุ",
    };

    return project.currentStatus.notifications.map((n) => ({
      type: n.notificationType,
      label: notificationLabels[n.notificationType],
      isRequired: n.isRequired,
      isCompleted: n.isCompleted,
      completedAt: n.completedAt ?? undefined,
      completedBy: n.completer
        ? { id: n.completer.id, name: n.completer.name }
        : undefined,
    }));
  }

  /**
   * Mark a notification as complete
   */
  async completeNotification(
    projectId: string,
    notificationType: NotificationType,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          currentStatusCode: true,
          currentStatus: {
            include: {
              notifications: true,
            },
          },
        },
      });

      if (!project || project.currentStatusCode !== "STATUS_10") {
        return {
          success: false,
          error: "โครงการไม่อยู่ในขั้นตอนการแจ้งหน่วยงาน (STATUS_10)",
        };
      }

      const notification = project.currentStatus?.notifications.find(
        (n) => n.notificationType === notificationType,
      );

      if (!notification) {
        return {
          success: false,
          error: "ไม่พบรายการแจ้งนี้",
        };
      }

      if (notification.isCompleted) {
        return {
          success: false,
          error: "รายการนี้ได้รับการแจ้งเรียบร้อยแล้ว",
        };
      }

      await prisma.notificationStatus.update({
        where: { id: notification.id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          completedBy: userId,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Complete notification error:", error);
      return {
        success: false,
        error: "เกิดข้อผิดพลาดในการบันทึก",
      };
    }
  }

  /**
   * Request document recall (does not transition yet)
   */
  async recallDocument(
    projectId: string,
    userId: string,
    reason?: string,
  ): Promise<{ success: boolean; error?: string; requestId?: string }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        currentStatusCode: true,
        currentStatusId: true,
        currentStatus: {
          include: {
            notifications: true,
          },
        },
      },
    });

    // Can only recall from STATUS_1
    if (project?.currentStatusCode !== "STATUS_1") {
      return {
        success: false,
        error: "สามารถเรียกคืนเอกสารได้เฉพาะในขั้นตอน STATUS_1 เท่านั้น",
      };
    }

    if (!project.currentStatusId) {
      return {
        success: false,
        error: "ไม่พบสถานะปัจจุบันของโครงการ",
      };
    }

    const existingDeptNotification = project.currentStatus?.notifications.find(
      (n) => n.notificationType === "DEPT_HEAD",
    );

    if (
      existingDeptNotification &&
      existingDeptNotification.recipient !== RECALL_REQUEST_TAG
    ) {
      return {
        success: false,
        error: "ไม่สามารถสร้างคำขอเรียกคืนในสถานะนี้ได้",
      };
    }

    if (
      existingDeptNotification?.recipient === RECALL_REQUEST_TAG &&
      !existingDeptNotification.isCompleted
    ) {
      return {
        success: false,
        error: "มีคำขอเรียกคืนที่รอการรับรองอยู่แล้ว",
      };
    }

    const note = reason ? `PENDING: ${reason}` : "PENDING";

    const request = existingDeptNotification
      ? await prisma.notificationStatus.update({
          where: { id: existingDeptNotification.id },
          data: {
            isRequired: true,
            isCompleted: false,
            completedAt: null,
            completedBy: null,
            recipient: RECALL_REQUEST_TAG,
            notes: note,
          },
        })
      : await prisma.notificationStatus.create({
          data: {
            statusId: project.currentStatusId,
            notificationType: "DEPT_HEAD",
            isRequired: true,
            isCompleted: false,
            recipient: RECALL_REQUEST_TAG,
            notes: note,
          },
        });

    return { success: true, requestId: request.id };
  }

  async reviewRecallRequest(
    projectId: string,
    reviewerId: string,
    actorRole: string,
    decision: RecallReviewDecision,
    note?: string,
  ): Promise<{
    success: boolean;
    error?: string;
    transitioned?: boolean;
    statusCode?: number;
  }> {
    if (actorRole !== "ภาควิชาวิทยาศาสตร์") {
      return {
        success: false,
        error:
          "เฉพาะหัวหน้าภาค (ภาควิชาวิทยาศาสตร์) เท่านั้นที่รับรองคำขอเรียกคืนได้",
        statusCode: 403,
      };
    }

    const assignment = await this.getDepartmentHeadAssignment(projectId);
    if (!assignment) {
      return {
        success: false,
        error: "ไม่พบการกำหนดหัวหน้าภาคของภาควิชานี้ กรุณาให้งานวิจัยกำหนดก่อน",
        statusCode: 400,
      };
    }

    if (assignment.headUserId !== reviewerId) {
      return {
        success: false,
        error: "ผู้ใช้นี้ไม่ใช่หัวหน้าภาคที่ถูกกำหนดของภาควิชานี้",
        statusCode: 403,
      };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        currentStatusCode: true,
        currentStatus: {
          include: {
            notifications: true,
          },
        },
      },
    });

    if (!project || project.currentStatusCode !== "STATUS_1") {
      return {
        success: false,
        error: "โครงการต้องอยู่ใน STATUS_1 เพื่อพิจารณาคำขอเรียกคืน",
        statusCode: 400,
      };
    }

    const request = project.currentStatus?.notifications.find(
      (n) =>
        n.notificationType === "DEPT_HEAD" &&
        n.recipient === RECALL_REQUEST_TAG,
    );

    if (!request) {
      return {
        success: false,
        error: "ไม่พบคำขอเรียกคืนที่รอการรับรอง",
        statusCode: 400,
      };
    }

    if (request.isCompleted) {
      return {
        success: false,
        error: "คำขอเรียกคืนนี้ถูกพิจารณาแล้ว",
        statusCode: 409,
      };
    }

    const reviewNote = note?.trim();
    const resultNote =
      decision === "APPROVE"
        ? `${RECALL_APPROVED_PREFIX}${reviewNote ? `: ${reviewNote}` : ""}`
        : `${RECALL_REJECTED_PREFIX}${reviewNote ? `: ${reviewNote}` : ""}`;

    await prisma.notificationStatus.update({
      where: { id: request.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        completedBy: reviewerId,
        notes: resultNote,
      },
    });

    if (decision === "REJECT") {
      return {
        success: true,
        transitioned: false,
      };
    }

    const transitionResult = await this.transitionStatus(
      projectId,
      "RECALL",
      reviewerId,
      reviewNote,
    );

    if (!transitionResult.success) {
      return {
        success: false,
        error: transitionResult.error,
        statusCode: 400,
      };
    }

    return {
      success: true,
      transitioned: true,
    };
  }

  /**
   * Get complete status history for a project
   */
  async getStatusHistory(projectId: string) {
    return prisma.projectStatusRecord.findMany({
      where: { projectId },
      include: {
        enteredByUser: {
          select: { id: true, name: true, email: true },
        },
        notifications: {
          include: {
            completer: {
              select: { id: true, name: true },
            },
          },
        },
        actionLogs: {
          include: {
            actorUser: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { enteredAt: "desc" },
    });
  }
}

// Export singleton instance
export const statusService = new StatusTransitionService();
