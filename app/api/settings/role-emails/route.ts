import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";

/** role ที่ตั้งค่าอีเมลผู้รับได้ (PROJECT_OWNER ใช้อีเมลเจ้าของโครงการจริง จึงไม่รวม) */
export const CONFIGURABLE_ROLES = [
  "DEPT_HEAD",
  "RESEARCH",
  "RESEARCH_HEAD",
  "PLANNING",
  "FINANCE",
  "PHYSICAL",
] as const;

const ROLE_SET = new Set<string>(CONFIGURABLE_ROLES);

// key เป็น string (ส่งมาบางส่วนได้) — ค่าว่าง = ลบ override, มีค่า = ต้องเป็นอีเมล
// role ที่ไม่รู้จักจะถูกกรองทิ้งในตัว handler
const updateSchema = z.object({
  emails: z.record(
    z.string(),
    z.union([z.literal(""), z.string().email("อีเมลไม่ถูกต้อง")]),
  ),
});

// GET /api/settings/role-emails — คืนอีเมลที่ตั้งไว้ของทุก role (role ที่ยังไม่ตั้ง = "")
export async function GET() {
  try {
    const rows = await prisma.roleEmailSetting.findMany();
    const byRole = new Map(rows.map((r) => [r.role, r.email]));
    const emails = Object.fromEntries(
      CONFIGURABLE_ROLES.map((role) => [role, byRole.get(role) ?? ""]),
    );
    return successResponse({ emails });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/settings/role-emails — บันทึกอีเมลต่อ role (ค่าว่าง = ลบ override)
export async function PUT(request: NextRequest) {
  try {
    const { emails } = updateSchema.parse(await request.json());

    await prisma.$transaction(
      Object.entries(emails)
        .filter(([role]) => ROLE_SET.has(role)) // กรองเฉพาะ role ที่รู้จัก
        .map(([role, value]) => {
          const email = value.trim();
          if (!email) {
            return prisma.roleEmailSetting.deleteMany({ where: { role } });
          }
          return prisma.roleEmailSetting.upsert({
            where: { role },
            create: { role, email },
            update: { email },
          });
        }),
    );

    const rows = await prisma.roleEmailSetting.findMany();
    const byRole = new Map(rows.map((r) => [r.role, r.email]));
    const result = Object.fromEntries(
      CONFIGURABLE_ROLES.map((role) => [role, byRole.get(role) ?? ""]),
    );
    return successResponse({ success: true, emails: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.flatten() },
        { status: 400 },
      );
    }
    return handleApiError(error);
  }
}
