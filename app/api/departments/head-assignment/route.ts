import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const upsertAssignmentSchema = z.object({
  department: z.string().min(1),
  headUserId: z.string().min(1),
  actorRole: z.enum([
    "USER",
    "ภาควิชา",
    "งานวิจัย",
    "งานแผน",
    "งานคลัง",
    "กายภาพ",
  ]),
  actorUserId: z.string().min(1),
});

// GET /api/departments/head-assignment?department=<name>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department")?.trim();

    if (department) {
      const assignment = await prisma.departmentHeadAssignment.findUnique({
        where: { department },
        include: {
          headUser: { select: { id: true, name: true, email: true } },
          assignedByUser: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json({ success: true, data: assignment });
    }

    const assignments = await prisma.departmentHeadAssignment.findMany({
      orderBy: { department: "asc" },
      include: {
        headUser: { select: { id: true, name: true, email: true } },
        assignedByUser: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error("Get department head assignment error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลการกำหนดหัวหน้าภาค" },
      { status: 500 },
    );
  }
}

// POST /api/departments/head-assignment
// Only งานวิจัย can manage assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = upsertAssignmentSchema.parse(body);

    if (payload.actorRole !== "งานวิจัย") {
      return NextResponse.json(
        { error: "เฉพาะงานวิจัยเท่านั้นที่กำหนดหัวหน้าภาคได้" },
        { status: 403 },
      );
    }

    const [headUser, assignedByUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.headUserId } }),
      prisma.user.findUnique({ where: { id: payload.actorUserId } }),
    ]);

    if (!headUser || !assignedByUser) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้สำหรับการกำหนดหัวหน้าภาค" },
        { status: 400 },
      );
    }

    const assignment = await prisma.departmentHeadAssignment.upsert({
      where: { department: payload.department.trim() },
      create: {
        department: payload.department.trim(),
        headUserId: payload.headUserId,
        assignedByUserId: payload.actorUserId,
      },
      update: {
        headUserId: payload.headUserId,
        assignedByUserId: payload.actorUserId,
      },
      include: {
        headUser: { select: { id: true, name: true, email: true } },
        assignedByUser: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Upsert department head assignment error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการกำหนดหัวหน้าภาค" },
      { status: 500 },
    );
  }
}
