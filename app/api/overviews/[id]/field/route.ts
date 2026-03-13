import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { updateFieldSchema } from "../../schema";

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
