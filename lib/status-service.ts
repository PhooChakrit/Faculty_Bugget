import { prisma } from "./prisma";
import type {
  StatusCode,
  NotificationType,
} from "../app/generated/prisma/client";
import { allowedTransitions, statusLabels } from "./status-constants";

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

export class StatusTransitionService {
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

    // Special validation for STATUS_10 -> STATUS_11 transition
    // Must complete all required notifications first
    if (currentStatus === "STATUS_10" && toStatus === "STATUS_11") {
      const requiredComplete =
        await this.areAllRequiredNotificationsComplete(projectId);
      if (!requiredComplete) {
        return {
          isValid: false,
          reason: "ต้องแจ้งหัวหน้าภาควิชาก่อน (10.1 บังคับ)",
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
      const result = await prisma.$transaction(async (tx) => {
        // 1. Close current status record (set exitedAt)
        const project = await tx.project.findUnique({
          where: { id: projectId },
          select: { currentStatusId: true, currentStatusCode: true },
        });

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

        // 3. Create notifications if entering STATUS_10
        if (toStatus === "STATUS_10") {
          await this.createNotifications(tx, newStatusRecord.id);
        }

        // 4. Update project's current status
        await tx.project.update({
          where: { id: projectId },
          data: {
            currentStatusCode: toStatus,
            currentStatusId: newStatusRecord.id,
          },
        });

        return newStatusRecord;
      });

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
        notificationType: "DEPT_HEAD",
        isRequired: true,
        isCompleted: false,
      },
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
   * Handle document recall (transition to RECALL status)
   */
  async recallDocument(
    projectId: string,
    userId: string,
    reason?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { currentStatusCode: true },
    });

    // Can only recall from STATUS_1
    if (project?.currentStatusCode !== "STATUS_1") {
      return {
        success: false,
        error: "สามารถเรียกคืนเอกสารได้เฉพาะในขั้นตอน STATUS_1 เท่านั้น",
      };
    }

    return this.transitionStatus(projectId, "RECALL", userId, reason);
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
      },
      orderBy: { enteredAt: "desc" },
    });
  }
}

// Export singleton instance
export const statusService = new StatusTransitionService();
