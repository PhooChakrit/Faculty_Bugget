import { NextResponse } from "next/server";
import { ZodError, ZodIssue } from "zod";
import { Prisma } from "@/app/generated/prisma/client";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
};

export function successResponse<T>(
  data: T,
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 500,
  details?: unknown,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: message, details },
    { status },
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  // Zod validation error
  if (error instanceof ZodError) {
    return errorResponse(
      "Validation failed",
      400,
      error.issues.map((e: ZodIssue) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    switch (prismaError.code) {
      case "P2002":
        return errorResponse("A record with this value already exists", 409);
      case "P2025":
        return errorResponse("Record not found", 404);
      case "P2003": {
        const meta = prismaError.meta as
          | { field_name?: string; model_name?: string }
          | undefined;
        const hint = meta?.field_name
          ? ` (${meta.field_name}${meta.model_name ? ` on ${meta.model_name}` : ""})`
          : "";
        return errorResponse(
          `Foreign key constraint failed${hint}. Related row is missing — e.g. leaderId must be an existing User id; targetGroupIds / strategyIds must exist (run seed).`,
          400,
          meta,
        );
      }
      default:
        return errorResponse(`Database error: ${prismaError.code}`, 500);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return errorResponse("Invalid data provided", 400);
  }

  // Generic error
  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse("An unexpected error occurred", 500);
}
