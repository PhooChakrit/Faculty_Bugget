import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { updateFieldSchema } from "../../schema";
import { statusService } from "@/lib/status-service";
import { StatusCode, formatStatusDisplay } from "@/lib/status-constants";
import { ensureMockActor } from "@/lib/ensure-mock-actor";

const INTERNAL_REVIEW_CHECKED_NOTE = "INTERNAL_REVIEW_CHECKED";

const getStatusKey = (statusValue: string | null | undefined) => {
  if (!statusValue) return "";
  if (statusValue === "DRAFT" || statusValue.startsWith("DRAFT")) {
    return "DRAFT";
  }
  return statusValue.split(".")[0].trim();
};

const toCurrentStatusCode = (statusKey: string) => {
  if (statusKey === "DRAFT") return "DRAFT";
  if (statusKey === "RECALL") return "RECALL";
  return `STATUS_${statusKey}`;
};

const getStatusKeyFromCurrentStatusCode = (statusCode: string | null) => {
  if (!statusCode) return "";
  if (statusCode === "DRAFT" || statusCode === "RECALL") return statusCode;
  return statusCode.replace("STATUS_", "");
};

const isWorkflowStatusCode = (value: string): value is StatusCode =>
  Object.values(StatusCode).includes(value as StatusCode);

const toDisplayStatus = (statusCode: StatusCode) => {
  return formatStatusDisplay(statusCode);
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH /api/overviews/[id]/field - Update a single field
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { field, value, actorRole, actorUserId } =
      updateFieldSchema.parse(body);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        currentStatus: {
          include: {
            notifications: true,
          },
        },
        roleCompletions: true,
        leader: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (field === "_internalReviewChecked") {
      if (actorRole !== "งานวิจัย") {
        return Response.json(
          { error: "เฉพาะงานวิจัยเท่านั้นที่ติดธงตรวจสอบแล้วได้" },
          { status: 403 },
        );
      }

      if (!actorUserId) {
        return Response.json(
          { error: "ต้องระบุ actorUserId เพื่อบันทึกผู้กดตรวจสอบแล้ว" },
          { status: 400 },
        );
      }

      const actorUser = await ensureMockActor(actorUserId);
      if (!actorUser) {
        return Response.json(
          { error: "ไม่พบผู้ใช้สำหรับบันทึก action log" },
          { status: 400 },
        );
      }

      if (
        project.currentStatusCode !== "STATUS_1" ||
        !project.currentStatusId
      ) {
        return Response.json(
          { error: "ติดธงตรวจสอบแล้วได้เฉพาะโครงการที่อยู่ใน STATUS_1" },
          { status: 400 },
        );
      }

      const shouldMarkChecked = value === "true";
      const currentNotes = project.currentStatus?.notes ?? "";
      const notes = shouldMarkChecked
        ? currentNotes.includes(INTERNAL_REVIEW_CHECKED_NOTE)
          ? currentNotes
          : [currentNotes, INTERNAL_REVIEW_CHECKED_NOTE]
              .filter(Boolean)
              .join("\n")
        : currentNotes
            .split("\n")
            .filter((line) => line !== INTERNAL_REVIEW_CHECKED_NOTE)
            .join("\n");

      const [updatedStatus, actionLog] = await prisma.$transaction([
        prisma.projectStatusRecord.update({
          where: { id: project.currentStatusId },
          data: { notes },
        }),
        prisma.projectStatusActionLog.create({
          data: {
            projectId: id,
            statusRecordId: project.currentStatusId,
            actionType: "INTERNAL_REVIEW_CHECKED",
            actorUserId: actorUser.id,
            actorRole,
            note: shouldMarkChecked ? "ตรวจสอบแล้ว (1.5)" : "ยกเลิกตรวจสอบแล้ว",
          },
          include: {
            actorUser: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
      ]);

      return successResponse({
        success: true,
        reviewChecked: updatedStatus.notes?.includes(
          INTERNAL_REVIEW_CHECKED_NOTE,
        ),
        actionLog,
      });
    }

    // Map frontend field names to database field names
    const fieldMap: Record<string, string> = {
      _projectStatus: "status1",
      vendorCode: "vendorCode",
      _costCenter: "costCenter",
      _maintenanceFee: "maintenanceFeeActual",
      _electricityFeeActual: "electricityFeeActual",
    };

    const dbField = fieldMap[field];
    if (!dbField) {
      return Response.json({ error: "Invalid field" }, { status: 400 });
    }

    if (dbField !== "status1") {
      if (!actorRole || !actorUserId) {
        return Response.json(
          { error: "actorRole และ actorUserId จำเป็นสำหรับการแก้ไขข้อมูล" },
          { status: 400 },
        );
      }

      const editableStatuses = ["STATUS_4", "STATUS_5", "STATUS_6", "STATUS_7"];
      const physicalEditableStatuses = ["STATUS_6", "STATUS_7"];
      const currentStatus = project.currentStatusCode;
      const permissionError = (() => {
        if (dbField === "vendorCode") {
          if (actorRole !== "งานคลัง") return "Vendor แก้ไขได้เฉพาะงานคลัง";
          if (!editableStatuses.includes(currentStatus ?? "")) {
            return "Vendor แก้ไขได้เฉพาะ State 4/5/6/7";
          }
        }

        if (dbField === "costCenter") {
          if (actorRole !== "งานแผน") return "ศูนย์ต้นทุนแก้ไขได้เฉพาะงานแผน";
          if (!editableStatuses.includes(currentStatus ?? "")) {
            return "ศูนย์ต้นทุนแก้ไขได้เฉพาะ State 4/5/6/7";
          }
        }

        if (
          dbField === "maintenanceFeeActual" ||
          dbField === "electricityFeeActual"
        ) {
          if (actorRole !== "กายภาพ") return "ข้อมูลกายภาพแก้ไขได้เฉพาะกายภาพ";
          if (!physicalEditableStatuses.includes(currentStatus ?? "")) {
            return "ข้อมูลกายภาพแก้ไขได้เฉพาะ State 6/7";
          }
        }

        return null;
      })();

      if (permissionError) {
        return Response.json({ error: permissionError }, { status: 403 });
      }
    }

    const currentStatusKey =
      dbField === "status1"
        ? getStatusKeyFromCurrentStatusCode(project.currentStatusCode) ||
          getStatusKey(project.status1)
        : "";

    if (dbField === "status1") {
      if (!actorRole) {
        return Response.json(
          { error: "actorRole is required for status updates" },
          { status: 400 },
        );
      }

      const nextStatusKey = getStatusKey(value);
      const nextStatusCode = toCurrentStatusCode(nextStatusKey);

      if (!isWorkflowStatusCode(nextStatusCode)) {
        return Response.json(
          { error: "สถานะนี้ไม่อยู่ใน workflow ปัจจุบัน" },
          { status: 400 },
        );
      }

      if (currentStatusKey !== nextStatusKey) {
        const isDraftSubmission =
          currentStatusKey === "DRAFT" && nextStatusKey === "0";
        const isDeptApproval =
          currentStatusKey === "0" && nextStatusKey === "1";
        const isInternalReviewComplete =
          currentStatusKey === "1" && nextStatusKey === "2";
        const isResearchHeadApproval =
          currentStatusKey === "2" && nextStatusKey === "3";
        const isBoardBranch =
          currentStatusKey === "3" &&
          (nextStatusKey === "4" || nextStatusKey === "5");
        const isApproveRecall =
          currentStatusKey === "RECALL" && nextStatusKey === "DRAFT";
        const canEditStatus = isDraftSubmission
          ? actorRole === "USER"
          : isDeptApproval
            ? actorRole === "ภาควิชาวิทยาศาสตร์"
            : isApproveRecall
              ? actorRole === "งานวิจัย"
              : isResearchHeadApproval
                ? actorRole === "หัวหน้าฝ่ายวิจัย"
                : actorRole === "งานวิจัย";

        if (!canEditStatus) {
          return Response.json(
            {
              error: "ไม่มีสิทธิ์เปลี่ยนสถานะนี้",
            },
            { status: 403 },
          );
        }

        if (
          isInternalReviewComplete &&
          !project.currentStatus?.notes?.includes(INTERNAL_REVIEW_CHECKED_NOTE)
        ) {
          return Response.json(
            {
              error:
                "ต้องติดธงตรวจสอบแล้ว (1.5) ก่อนเปลี่ยนจาก STATUS_1 เป็น STATUS_2",
            },
            { status: 400 },
          );
        }

        if (isBoardBranch) {
          const hasBoardMeeting = await prisma.meeting.findFirst({
            where: {
              projectId: id,
              type: "BOARD",
            },
            select: { id: true },
          });

          if (!hasBoardMeeting) {
            return Response.json(
              {
                error:
                  "ต้องบันทึกข้อมูลมติที่ประชุมคณะกรรมการก่อนเปลี่ยนจาก STATUS_3",
              },
              { status: 400 },
            );
          }
        }

        if (
          (isDraftSubmission || isDeptApproval) &&
          !(await statusService.hasDepartmentHeadAssignment(id))
        ) {
          return Response.json(
            {
              error:
                "ไม่พบการกำหนดหัวหน้าภาคของภาควิชานี้ กรุณาให้งานวิจัยกำหนดก่อนส่งหรืออนุมัติ",
            },
            { status: 400 },
          );
        }

        const requestedUser = actorUserId
          ? await ensureMockActor(actorUserId)
          : null;
        const departmentHeadAssignment = isDeptApproval
          ? await statusService.getDepartmentHeadAssignment(id)
          : null;
        const transitionUserId =
          departmentHeadAssignment?.headUserId ??
          requestedUser?.id ??
          project.leader.id;

        if (isDeptApproval) {
          const isAssignedHead = await statusService.isAssignedDepartmentHead(
            id,
            transitionUserId,
          );
          if (!isAssignedHead) {
            return Response.json(
              {
                error: "ผู้ใช้นี้ไม่ใช่หัวหน้าภาคที่ถูกกำหนดของภาควิชานี้",
              },
              { status: 403 },
            );
          }
        }

        const result = await statusService.transitionStatus(
          id,
          nextStatusCode,
          transitionUserId,
        );

        if (!result.success) {
          return Response.json(
            { error: result.error ?? "Invalid status transition" },
            { status: 400 },
          );
        }

        const displayStatus = toDisplayStatus(nextStatusCode);
        const updatedProject = await prisma.project.update({
          where: { id },
          data: {
            status1: displayStatus,
            status1Date: new Date(),
          },
        });

        return successResponse({
          success: true,
          project: updatedProject,
          statusRecord: result.statusRecord,
          displayStatus,
        });
      }
    }

    // Prepare update data based on field type
    const updateData: Record<string, string | number> = {};

    if (
      dbField === "maintenanceFeeActual" ||
      dbField === "electricityFeeActual"
    ) {
      // Parse as number for fee fields (Prisma will handle Decimal conversion)
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return Response.json(
          { error: "Invalid numeric value" },
          { status: 400 },
        );
      }
      updateData[dbField] = numValue;
    } else {
      // String fields
      updateData[dbField] = value;
    }

    const actorUser =
      actorUserId && dbField !== "status1"
        ? await ensureMockActor(actorUserId)
        : null;
    if (dbField !== "status1" && !actorUser) {
      return Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึก action log" },
        { status: 400 },
      );
    }

    // Update project
    const [updatedProject] = await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: updateData,
      }),
      ...(actorUser && actorRole
        ? [
            prisma.projectStatusActionLog.create({
              data: {
                projectId: id,
                statusRecordId: project.currentStatusId,
                actionType: `FIELD_UPDATE:${dbField}`,
                actorUserId: actorUser.id,
                actorRole,
                note: value,
              },
            }),
          ]
        : []),
    ]);

    // ข้อมูลประกอบเปลี่ยน (รหัสเจ้าหนี้/ศูนย์ต้นทุน) → เช็คว่าพร้อมอนุมัติแล้วหรือยัง
    await statusService.notifyOnDataProgress(id);

    return successResponse({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
