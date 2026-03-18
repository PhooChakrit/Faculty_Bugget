import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { updateFieldSchema } from "../../schema";

const STATUS_TRANSITION_FLOW: Record<string, string[]> = {
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
  "10": ["11"],
  "11": ["12"],
  "12": ["13"],
  "13": [],
};

const getStatusKey = (statusValue: string | null | undefined) => {
  if (!statusValue) return "";
  return statusValue.split(".")[0].trim();
};

const toCurrentStatusCode = (statusKey: string) => {
  if (statusKey === "RECALL") return "RECALL";
  return `STATUS_${statusKey}`;
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
    const { field, value } = updateFieldSchema.parse(body);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        currentStatus: {
          include: {
            notifications: true,
          },
        },
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
      const currentStatusKey = getStatusKey(project.status1);
      const nextStatusKey = getStatusKey(value);

      if (currentStatusKey !== nextStatusKey) {
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

        if (currentStatusKey === "10" && nextStatusKey === "11") {
          const requiredNotifications =
            project.currentStatus?.notifications.filter((n) => n.isRequired) ??
            [];
          const canMoveTo11 =
            requiredNotifications.length > 0 &&
            requiredNotifications.every((n) => n.isCompleted);

          if (!canMoveTo11) {
            return Response.json(
              {
                error:
                  "Cannot move from status 10 to 11 until required notifications are complete",
              },
              { status: 400 },
            );
          }
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
        updateData.currentStatusCode = toCurrentStatusCode(getStatusKey(value));
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
