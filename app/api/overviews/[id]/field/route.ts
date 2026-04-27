import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { updateFieldSchema } from "../../schema";

const STATUS_TRANSITION_FLOW: Record<string, string[]> = {
  DRAFT: ["0"],
  "0": ["1"],
  "1": ["2", "RECALL"],
  RECALL: ["1"],
  "2": ["1", "3"],
  "3": ["4", "5"],
  "4": ["6"],
  "5": ["7"],
  "6": ["8"],
  "7": ["9"],
  "8": ["10"],
  "9": ["10"],
  "10": [],
};

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
    const { field, value, actorRole } = updateFieldSchema.parse(body);

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
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
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

    if (dbField === "status1") {
      if (!actorRole) {
        return Response.json(
          { error: "actorRole is required for status updates" },
          { status: 400 },
        );
      }

      const currentStatusKey =
        getStatusKey(project.status1) ||
        getStatusKeyFromCurrentStatusCode(project.currentStatusCode);
      const nextStatusKey = getStatusKey(value);

      if (currentStatusKey !== nextStatusKey) {
        const isDraftSubmission =
          currentStatusKey === "DRAFT" && nextStatusKey === "0";
        const isDeptApproval =
          currentStatusKey === "0" && nextStatusKey === "1";
        const canEditStatus =
          actorRole === "งานวิจัย" ||
          (isDraftSubmission && actorRole === "USER") ||
          (isDeptApproval && actorRole === "ภาควิชา");

        if (!canEditStatus) {
          return Response.json(
            {
              error:
                "ไม่มีสิทธิ์เปลี่ยนสถานะนี้",
            },
            { status: 403 },
          );
        }

        const allowedNextStatuses =
          STATUS_TRANSITION_FLOW[currentStatusKey] ?? [];

        if (!allowedNextStatuses.includes(nextStatusKey)) {
          return Response.json(
            {
              error: "Invalid status transition",
              currentStatus: currentStatusKey,
              allowedTransitions: allowedNextStatuses,
            },
            { status: 400 },
          );
        }
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

      if (dbField === "status1") {
        const nextStatusKey = getStatusKey(value);
        updateData.currentStatusCode = toCurrentStatusCode(nextStatusKey);

        if (nextStatusKey === "DRAFT") {
          updateData.draftState = "DRAFT";
        } else {
          updateData.draftState = "SUBMITTED";
        }
      }
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return successResponse({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
