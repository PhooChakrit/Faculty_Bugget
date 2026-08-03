/**
 * อีเมลแจ้งเตือนแบบ "next-actor" — ส่งหา role ที่ต้องลงมือทำขั้นถัดไป
 * (ไม่ใช่ส่งหาเจ้าของโครงการทุกสถานะ)
 */

/** role ผู้รับ (map ไปหาอีเมลจริงใน status-service) */
export type RecipientRole =
  | "PROJECT_OWNER"
  | "DEPT_HEAD"
  | "RESEARCH"
  | "RESEARCH_HEAD"
  | "PLANNING"
  | "FINANCE"
  | "PHYSICAL";

/** เหตุการณ์ที่ทำให้เกิดอีเมล */
export type NotificationEvent =
  | "AWAIT_DEPT_HEAD" // เข้า STATUS_0 → หัวหน้าภาค
  | "AWAIT_RESEARCH_REVIEW" // เข้า STATUS_1 → งานวิจัย
  | "AWAIT_RESEARCH_HEAD" // เข้า STATUS_2 → หัวหน้าฝ่ายวิจัย
  | "REQUEST_VENDOR_COSTCENTER" // เข้า STATUS_4/5 → งานคลัง + งานแผน
  | "REQUEST_DEAN_DOC" // เข้า STATUS_5 → งานวิจัย (แนบเอกสารอนุมัติคณบดี)
  | "READY_TO_RELEASE" // ข้อมูลประกอบครบ → งานวิจัย (กดอนุมัติดำเนินการ)
  | "AWAIT_REPORT_UPLOAD" // เข้า STATUS_6/7 (อนุมัติแล้ว) → เจ้าของโครงการ (อัปโหลดรายงาน)
  | "PROJECT_OPENED" // เปิดโครงการ (เข้า 6/7) → งานวิจัย/งานคลัง/งานแผน/งานกายภาพ
  | "PROJECT_CLOSED"; // ปิดโครงการ (เข้า 8) → งานวิจัย/งานคลัง/งานแผน/งานกายภาพ

export interface EmailTemplateContext {
  projectRef: string;
  projectName?: string | null;
  /** label ของผู้รับ ใช้ขึ้นต้นอีเมล เช่น "งานคลัง" */
  recipientLabel: string;
  projectUrl?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

const FACULTY_NAME = "คณะวิทยาศาสตร์";

/** ผู้รับของแต่ละเหตุการณ์ */
const EVENT_RECIPIENTS: Record<NotificationEvent, RecipientRole[]> = {
  AWAIT_DEPT_HEAD: ["DEPT_HEAD"],
  AWAIT_RESEARCH_REVIEW: ["RESEARCH"],
  AWAIT_RESEARCH_HEAD: ["RESEARCH_HEAD"],
  REQUEST_VENDOR_COSTCENTER: ["FINANCE", "PLANNING"],
  REQUEST_DEAN_DOC: ["RESEARCH"],
  READY_TO_RELEASE: ["RESEARCH"],
  AWAIT_REPORT_UPLOAD: ["PROJECT_OWNER"],
  PROJECT_OPENED: ["RESEARCH", "FINANCE", "PLANNING", "PHYSICAL"],
  PROJECT_CLOSED: ["RESEARCH", "FINANCE", "PLANNING", "PHYSICAL"],
};

export function eventRecipients(event: NotificationEvent): RecipientRole[] {
  return EVENT_RECIPIENTS[event];
}

type EventTemplate = {
  accentColor: string;
  subject: (ctx: EmailTemplateContext) => string;
  heading: string;
  /** ข้อความหลัก (สั่งให้ผู้รับลงมือทำอะไร) */
  body: string;
  /** ป้ายปุ่ม CTA */
  cta: string;
};

const EVENT_TEMPLATES: Record<NotificationEvent, EventTemplate> = {
  AWAIT_DEPT_HEAD: {
    accentColor: "#d97706",
    heading: "มีโครงการรอการอนุมัติจากหัวหน้าภาควิชา",
    subject: (c) => `รออนุมัติ: โครงการ ${c.projectRef} (หัวหน้าภาควิชา)`,
    body: `<p style="margin:0">มีโครงการรอการพิจารณาอนุมัติจากท่านในฐานะ <strong>หัวหน้าภาควิชา</strong> เพื่อส่งต่อให้ฝ่ายวิจัยตรวจสอบ กรุณาเข้าระบบเพื่อพิจารณาอนุมัติ</p>`,
    cta: "พิจารณาอนุมัติ",
  },
  AWAIT_RESEARCH_REVIEW: {
    accentColor: "#ca8a04",
    heading: "มีโครงการรอฝ่ายวิจัยตรวจสอบ",
    subject: (c) => `รอตรวจสอบ: โครงการ ${c.projectRef} (ฝ่ายวิจัย)`,
    body: `<p style="margin:0">โครงการผ่านการอนุมัติจากหัวหน้าภาคแล้ว และรอให้ <strong>ฝ่ายวิจัย</strong> ตรวจสอบ/แก้ไข กรุณาตรวจสอบและดำเนินการต่อ (ติดธงตรวจแล้ว 1.5 → เสร็จสิ้นการตรวจ)</p>`,
    cta: "เริ่มตรวจสอบ",
  },
  AWAIT_RESEARCH_HEAD: {
    accentColor: "#2563eb",
    heading: "มีโครงการรอหัวหน้าฝ่ายวิจัยพิจารณา",
    subject: (c) => `รอพิจารณา: โครงการ ${c.projectRef} (เสนอกรรมการบริหาร)`,
    body: `<p style="margin:0">โครงการผ่านการตรวจสอบจากฝ่ายวิจัยแล้ว รอให้ <strong>หัวหน้าฝ่ายวิจัย</strong> พิจารณาเพื่อเสนอต่อคณะกรรมการบริหาร${FACULTY_NAME}</p>`,
    cta: "พิจารณาเสนอกรรมการ",
  },
  REQUEST_VENDOR_COSTCENTER: {
    accentColor: "#7c3aed",
    heading: "ขอข้อมูลประกอบก่อนอนุมัติโครงการ",
    subject: (c) =>
      `ขอข้อมูลประกอบ: โครงการ ${c.projectRef} (รหัสเจ้าหนี้/ศูนย์ต้นทุน)`,
    body: `<p style="margin:0">โครงการนี้ต้องการข้อมูลประกอบก่อนอนุมัติให้ดำเนินการ กรุณากรอกข้อมูลในส่วนของท่าน:</p>
      <ul style="margin:12px 0 0;padding-left:20px">
        <li><strong>งานคลัง</strong> — บันทึกรหัสเจ้าหนี้ (vendor code)</li>
        <li><strong>งานแผน</strong> — แนบไฟล์/ระบุศูนย์ต้นทุน (cost center)</li>
      </ul>`,
    cta: "กรอกข้อมูลประกอบ",
  },
  REQUEST_DEAN_DOC: {
    accentColor: "#7c3aed",
    heading: "ขอเอกสารอนุมัติคณบดี (เส้นทางที่ประชุมคณบดี)",
    subject: (c) => `ขอเอกสารอนุมัติคณบดี: โครงการ ${c.projectRef}`,
    body: `<p style="margin:0">โครงการนี้อยู่ในเส้นทางที่ประชุมคณบดี กรุณาให้ <strong>ฝ่ายวิจัย</strong> แนบเอกสารอนุมัติคณบดีเพื่อประกอบการอนุมัติให้ดำเนินโครงการ</p>`,
    cta: "แนบเอกสารอนุมัติคณบดี",
  },
  READY_TO_RELEASE: {
    accentColor: "#7c3aed",
    heading: "โครงการพร้อมอนุมัติให้ดำเนินการ",
    subject: (c) => `พร้อมอนุมัติ: โครงการ ${c.projectRef} (ข้อมูลครบแล้ว)`,
    body: `<p style="margin:0">ข้อมูลประกอบครบถ้วนแล้ว โครงการพร้อมให้ <strong>ฝ่ายวิจัย</strong> กดอนุมัติเพื่อให้เริ่มดำเนินโครงการ กรุณาเข้าระบบเพื่อดำเนินการ</p>`,
    cta: "อนุมัติให้ดำเนินการ",
  },
  AWAIT_REPORT_UPLOAD: {
    accentColor: "#7c3aed",
    heading: "โครงการได้รับอนุมัติแล้ว — กรุณาอัปโหลดรายงานผล",
    subject: (c) => `อนุมัติแล้ว: โครงการ ${c.projectRef} กรุณาอัปโหลดรายงานผล`,
    body: `<p style="margin:0">โครงการของท่าน <strong>ได้รับอนุมัติให้ดำเนินการ</strong> แล้ว เมื่อดำเนินโครงการเสร็จ กรุณาเข้าระบบเพื่อ <strong>อัปโหลดไฟล์รายงานผลการดำเนินโครงการ</strong> เพื่อเข้าสู่ขั้นตอนปิดโครงการ</p>`,
    cta: "อัปโหลดรายงานผล",
  },
  PROJECT_OPENED: {
    accentColor: "#7c3aed",
    heading: "โครงการเปิดดำเนินการแล้ว",
    subject: (c) => `เปิดโครงการ: โครงการ ${c.projectRef} อยู่ระหว่างดำเนินการ`,
    body: `<p style="margin:0">โครงการนี้ได้รับอนุมัติและอยู่ระหว่างดำเนินการแล้ว กรุณาให้แต่ละฝ่ายเข้ามาบันทึกข้อมูลในส่วนที่เกี่ยวข้อง</p>
      <p style="margin:12px 0 0"><strong>งานกายภาพ</strong> — กรุณาเข้ามากรอกค่าใช้จ่ายจริง (ค่าบำรุงสถานที่ / ค่าไฟฟ้า)</p>`,
    cta: "เปิดดูรายละเอียดโครงการ",
  },
  PROJECT_CLOSED: {
    accentColor: "#16a34a",
    heading: "ปิดโครงการเรียบร้อยแล้ว",
    subject: (c) => `ปิดโครงการ: โครงการ ${c.projectRef} เรียบร้อยแล้ว`,
    body: `<p style="margin:0">โครงการนี้ได้ปิดโครงการเรียบร้อยแล้ว ขอบคุณสำหรับการดำเนินงานของทุกฝ่าย เอกสารและข้อมูลทั้งหมดถูกบันทึกในระบบเป็นที่เรียบร้อย</p>`,
    cta: "เปิดดูรายละเอียดโครงการ",
  },
};

function renderLayout(
  template: EventTemplate,
  ctx: EmailTemplateContext,
): string {
  const projectName = ctx.projectName?.trim() || "(ไม่ระบุชื่อโครงการ)";
  const ctaHtml = ctx.projectUrl
    ? `<tr><td style="padding-top:24px">
         <a href="${ctx.projectUrl}"
            style="display:inline-block;background:${template.accentColor};color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px">
           ${template.cta}
         </a>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="th">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Sarabun','Segoe UI',Tahoma,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08)">
            <tr><td style="background:${template.accentColor};height:6px;font-size:0;line-height:0">&nbsp;</td></tr>
            <tr>
              <td style="padding:28px 32px 8px">
                <p style="margin:0 0 4px;font-size:13px;color:#64748b;letter-spacing:0.02em">ระบบบริหารงบประมาณโครงการ · ${FACULTY_NAME}</p>
                <h1 style="margin:0;font-size:20px;line-height:1.4;color:#0f172a">${template.heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7">เรียน ${ctx.recipientLabel}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;line-height:1.6">
                  <tr>
                    <td style="padding:12px 16px;color:#64748b;width:120px">รหัสโครงการ</td>
                    <td style="padding:12px 16px;font-weight:600">${ctx.projectRef}</td>
                  </tr>
                  <tr>
                    <td style="padding:0 16px 12px;color:#64748b">ชื่อโครงการ</td>
                    <td style="padding:0 16px 12px;font-weight:600">${projectName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;font-size:15px;line-height:1.7">${template.body}</td>
            </tr>
            <tr>
              <td style="padding:0 32px"><table role="presentation" cellpadding="0" cellspacing="0">${ctaHtml}</table></td>
            </tr>
            <tr>
              <td style="padding:28px 32px 32px">
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px" />
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8">
                  อีเมลฉบับนี้ส่งอัตโนมัติจากระบบบริหารงบประมาณโครงการ ${FACULTY_NAME} กรุณาอย่าตอบกลับอีเมลนี้
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderEventEmail(
  event: NotificationEvent,
  ctx: EmailTemplateContext,
): RenderedEmail {
  const template = EVENT_TEMPLATES[event];
  return {
    subject: template.subject(ctx),
    html: renderLayout(template, ctx),
  };
}
