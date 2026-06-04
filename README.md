# ระบบบริหารงบประมาณโครงการ — คณะวิทยาศาสตร์

ระบบจัดการและติดตามโครงการวิจัย/บริการวิชาการของคณะวิทยาศาสตร์ ตั้งแต่การสร้างแบบร่างจนถึงปิดโครงการ

---

## Tech Stack

| Layer | Library |
|---|---|
| Frontend | Next.js (App Router), React 19, TailwindCSS 4 |
| UI | Radix UI, Lucide React, React Hook Form + Zod |
| ORM | Prisma 7 + PostgreSQL |
| DB Host | Supabase (ชั่วคราว) → ย้าย self-hosted ทีหลัง |

---

## การติดตั้ง

```bash
npm install
cp .env.example .env   # แล้วใส่ค่า DATABASE_URL และ DIRECT_URL
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

### Environment Variables

```env
# Connection pooling — ใช้ตอน runtime
DATABASE_URL="postgresql://USER:PASS@HOST:6543/postgres?pgbouncer=true"

# Direct connection — ใช้ตอน migrate เท่านั้น
DIRECT_URL="postgresql://USER:PASS@HOST:5432/postgres"
```

> **หมายเหตุ:** `prisma migrate reset` ต้องรันด้วย `DATABASE_URL` ชี้ไปที่ port 5432 โดยตรง เนื่องจาก PgBouncer (port 6543) ไม่รองรับ prepared statements
>
> ```bash
> DATABASE_URL="postgresql://USER:PASS@HOST:5432/postgres" npx prisma migrate reset --force
> ```

---

## หน้าหลักของระบบ

| Route | หน้า |
|---|---|
| `/` | หน้าแรก (welcome) |
| `/projects` | รายการโครงการของ user |
| `/projects/[id]` | รายละเอียด/แก้ไขโครงการ |
| `/add-project` | สร้างโครงการใหม่ |
| `/overviews` | ตารางภาพรวมโครงการทั้งหมด (admin) |
| `/expense-dashboard` | dashboard งบประมาณ |

---

## API Routes หลัก

### Projects
```
GET    /api/projects                          รายการโครงการ
POST   /api/projects                          สร้าง / สร้าง draft
GET    /api/projects/[id]                     ดูโครงการ
PUT    /api/projects/[id]                     แก้ไขโครงการ
```

### Status Workflow
```
POST   /api/projects/[id]/status/transition   เปลี่ยนสถานะ
GET    /api/projects/[id]/status/history      ประวัติสถานะ
GET    /api/projects/[id]/status/notifications checklist notifications
POST   /api/projects/[id]/status/notifications/[type]/complete  ติ๊กเสร็จ
```

### Recall (ดึงกลับเอกสาร)
```
POST   /api/projects/[id]/recall              ขอดึงกลับ
POST   /api/projects/[id]/recall/review       อนุมัติ/ปฏิเสธ → กลับ DRAFT
```

### Overview Table (admin)
```
GET    /api/overviews                         ดึงข้อมูลตาราง
PATCH  /api/overviews/[id]/field              แก้ไข field เดี่ยว
PATCH  /api/overviews/[id]/completion         mark ครบ (วิจัย/กายภาพ)
PATCH  /api/overviews/[id]/meetings           บันทึกมติที่ประชุม
```

### Budget Revisions
```
GET    /api/projects/[id]/budget-revisions    รายการขอแก้ไขงบ
PUT    /api/budget-revisions/[id]             แก้ไข revision
POST   /api/budget-revisions/[id]/action      submit / review / approve
```

---

## Workflow สถานะโครงการ

```
DRAFT  ──► STATUS_0  ──► STATUS_1  ──► STATUS_2  ──► STATUS_3
(แบบร่าง)  (หัวหน้าภาค) (ฝ่ายวิจัย)  (รองคณบดี)   (กรรมการบริหาร)
                                                          │
                                             ┌────────────┴────────────┐
                                         STATUS_4                  STATUS_5
                                         (เสนอคณบดี)           (ที่ประชุมคณบดี)
                                             │                        │
                                         STATUS_6                 STATUS_7
                                         (อนุมัติ A)             (อนุมัติ B)
                                             └────────────┬────────────┘
                                                      STATUS_8
                                                      (ปิดโครงการ)

กรณีพิเศษ:  STATUS_1 ──► RECALL ──► DRAFT   (ดึงกลับ → แก้ไขใหม่)
```

**รหัสโครงการ** (`projectCode`) ถูก generate ตอนสร้าง draft ในรูปแบบ `YYnnn` เช่น `69001`, `69002`
(YY = 2 หลักท้ายของ พ.ศ., nnn = running number 001–999)

---

## Database Models หลัก

| Model | หน้าที่ |
|---|---|
| `Project` | ข้อมูลโครงการหลัก (งบ, สถานะ, ทีม) |
| `ProjectStatusRecord` | ประวัติ status ทุก step |
| `ProjectStatusActionLog` | audit log ทุก action |
| `BudgetRevision` | คำขอแก้ไขงบประมาณ |
| `Meeting` | มติที่ประชุม (BOARD / DEAN) |
| `NotificationStatus` | checklist notification แต่ละ role |
| `ProjectRoleCompletion` | ยืนยันครบ (RESEARCH / PHYSICAL / FINANCE) |
| `DepartmentHeadAssignment` | ผู้มีอำนาจแต่ละภาควิชา |

---

## โครงสร้างโฟลเดอร์

```
app/
  api/                  API routes (Next.js route handlers)
  projects/             หน้า project list และ detail
  overviews/            หน้า overview table
  add-project/          หน้าสร้างโครงการ
  expense-dashboard/    หน้า dashboard

features/
  add-project/          form สร้างโครงการ (schema, sync, sections)
  view-project/         display โครงการ

lib/
  status-service.ts     business logic workflow ทั้งหมด
  status-constants.ts   StatusCode enum, labels, allowedTransitions
  generate-project-id.ts  generate รหัส YYnnn
  mock-actors.ts        mock users สำหรับ dev
  prisma.ts             Prisma client singleton

components/
  Sidebar.tsx           sidebar navigation
  StatusTimeline.tsx    timeline แสดงประวัติสถานะ
  NotificationPhase.tsx checklist notification

prisma/
  schema.prisma         database schema
  migrations/           migration files

scripts/
  seed-static.ts        seed ข้อมูลเริ่มต้น (รัน npm run seed)
```

---

## Scripts

```bash
npm run seed                          # seed ข้อมูล static (users, dept)
npx tsx scripts/seed-overview.ts      # seed ข้อมูลตาราง overview
npx tsx scripts/check-users.ts        # ตรวจสอบ users ใน DB
npx tsx scripts/migrate-project-ids.ts  # migrate รูปแบบ project ID
```

---

## Database Schema

### กลุ่ม User & Auth

| Table | หน้าที่ |
|---|---|
| `User` | ผู้ใช้ทุกคนในระบบ (leader, co-leader, staff) — ยังไม่มี auth จริง ใช้ mock |
| `DepartmentHeadAssignment` | ระบุว่าแต่ละภาควิชาใครเป็นหัวหน้าภาค (ใช้ตอนส่งงาน STATUS_0 → 1) |

### กลุ่ม Project (ข้อมูลโครงการ)

| Table | หน้าที่ |
|---|---|
| `Project` | ตารางหลัก — เก็บทุกอย่างของโครงการ ทั้งข้อมูลทั่วไป งบประมาณ สถานะ และไฟล์แนบ |
| `IncomeItem` | รายรับของโครงการ แยกประเภท SUPPORT / REGISTRATION / OTHER |
| `ProjectCollaborator` | รายชื่อผู้ร่วมโครงการ (ชื่อล้วน ไม่ผูก User) |
| `ProjectManager` | รายชื่อคณะกรรมการจัดงาน |
| `ProjectTargetGroup` | กลุ่มเป้าหมาย (many-to-many กับ `TargetGroup`) |
| `ProjectStrategy` | ยุทธศาสตร์ที่โครงการสอดคล้อง (many-to-many กับ `Strategy`) |
| `TargetGroup` | master data กลุ่มเป้าหมาย |
| `Strategy` | master data ยุทธศาสตร์ |
| `Meeting` | มติที่ประชุม BOARD หรือ DEAN ที่ผ่านมติเรื่องโครงการนี้ |

> **หมายเหตุ `Project`:** มี field `status1`–`status5` เป็น legacy จาก overview sheet เก่า ระบบใหม่ใช้ `currentStatusCode` + `ProjectStatusRecord` แทน

### กลุ่ม Status Workflow

| Table | หน้าที่ |
|---|---|
| `ProjectStatusRecord` | ประวัติทุก status ที่โครงการเคยผ่าน — 1 row = 1 ช่วงสถานะ มี `enteredAt` / `exitedAt` |
| `ProjectStatusActionLog` | audit log ทุก action ย่อย เช่น กดติ๊ก กดอนุมัติ กดดึงกลับ |
| `NotificationStatus` | checklist ของแต่ละ status ว่าแจ้ง DEPT_HEAD / FINANCE / PLANNING / PHYSICAL ครบหรือยัง |
| `StatusTransition` | *(ใช้งานน้อย)* เก็บ allowed transitions ใน DB แต่ logic จริงอยู่ที่ `status-constants.ts` |

### กลุ่ม Budget Revision (ขอแก้ไขงบ)

| Table | หน้าที่ |
|---|---|
| `BudgetRevision` | คำขอแก้ไขงบประมาณ เก็บ snapshot งบเดิม vs ที่เสนอใหม่ พร้อม approval route (BOARD/DEAN) |
| `BudgetRevisionActionLog` | audit log ทุก action ของ revision นั้น (submit, review, approve, apply) |

### กลุ่ม Closure (ปิดโครงการ)

| Table | หน้าที่ |
|---|---|
| `ProjectRoleCompletion` | ยืนยันว่าแต่ละทีม (RESEARCH / PHYSICAL / FINANCE) ส่งเอกสารปิดโครงการครบแล้ว |
| `ApprovalEmailLog` | log การส่งอีเมลแจ้งอนุมัติ — ยังไม่ implement จริง |

### ความสัมพันธ์หลัก (ภาพรวม)

```
User ──── Project (leader / co-leader)
            │
            ├── IncomeItem
            ├── ProjectCollaborator
            ├── ProjectManager
            ├── Meeting
            ├── ProjectTargetGroup ── TargetGroup
            ├── ProjectStrategy ───── Strategy
            ├── ProjectStatusRecord ── NotificationStatus
            │     └── ProjectStatusActionLog
            ├── BudgetRevision
            │     └── BudgetRevisionActionLog
            ├── ProjectRoleCompletion
            └── ApprovalEmailLog
```

---

## สิ่งที่เสร็จแล้ว

### Core Workflow
- [x] สร้างโครงการแบบ draft อัตโนมัติ (เปิดหน้า add-project ได้เลย ระบบ save อัตโนมัติ)
- [x] generate รหัสโครงการ `YYnnn` (เช่น `69001`) ตอนสร้าง draft — ไม่ซ้ำ, ใช้ serializable transaction
- [x] ส่งโครงการผ่านทุก 8 สถานะ (DRAFT → STATUS_0 → ... → STATUS_8)
- [x] แยก 2 เส้นทาง ที่ STATUS_3 (เสนอคณบดีตรง vs ผ่านที่ประชุมคณบดี)
- [x] ดึงกลับเอกสาร (RECALL) — user ขอ → admin อนุมัติ → กลับ DRAFT
- [x] audit log ทุก action (ใครทำอะไร เมื่อไหร่ role อะไร)

### หน้า UI
- [x] `/projects` — รายการโครงการ, ค้นหา, ลบ
- [x] `/projects/[id]` — ดู/แก้ไขโครงการแบบ full form
- [x] `/add-project` — form สร้างโครงการ multi-section พร้อม auto-save
- [x] `/overviews` — ตารางภาพรวมทุกโครงการ แก้ไข field ได้ตาม role
- [x] `/expense-dashboard` — dashboard สรุปงบประมาณ
- [x] `/` — หน้าแรก welcome page

### Overview Table (หน้า /overviews)
- [x] แสดงข้อมูลโครงการทุกตัวในตารางเดียว
- [x] แก้ไข field ตาม role (งานวิจัย / งานคลัง / งานแผน / กายภาพ)
- [x] อัปเดตสถานะโครงการพร้อม transition validation
- [x] บันทึกมติที่ประชุม (BOARD / DEAN) และ "เพื่อดำเนินการ"
- [x] mark ครบ (RESEARCH / PHYSICAL) สำหรับโครงการ STATUS_8
- [x] แสดงคอลัมน์ รหัสโครงการ + เลขที่รับ

### งบประมาณ
- [x] บันทึกรายรับหลายประเภท (SUPPORT / REGISTRATION / OTHER + custom category)
- [x] บันทึกรายจ่าย 6 หมวด (ตอบแทน / ใช้สอย / วัสดุ / สาธารณูปโภค / อุดหนุน / สำรอง)
- [x] ขอแก้ไขงบ (Budget Revision) workflow ครบ: draft → submit → review → approve → apply
- [x] แนบไฟล์ Excel งบประมาณ
- [x] บันทึกค่าบำรุงสถานที่และค่าไฟฟ้า (เสนอ vs จริง)

### ไฟล์แนบ
- [x] แนบไฟล์ Excel (import งบประมาณ)
- [x] แนบไฟล์ศูนย์ต้นทุน (งานแผน)
- [x] แนบไฟล์ค่าบำรุงสถานที่จริง / ค่าไฟฟ้าจริง (กายภาพ)

### Notifications & Checklist
- [x] checklist notification แต่ละ status (DEPT_HEAD / FINANCE / PLANNING / PHYSICAL)
- [x] timeline แสดงประวัติสถานะทุก step
- [x] status badge พร้อมสีตามสถานะ

---

## สิ่งที่ยังไม่เสร็จ / ควรรู้ก่อนรับงาน

- **Auth ยังไม่มี** — ปัจจุบันใช้ mock actor (`DEFAULT_LEADER_ID`) hardcode ทุกที่ ต้องผูก session จริงทีหลัง
- **Role บน UI** — หน้า `/overviews` มี dropdown เลือก role สำหรับ dev test เท่านั้น ยังไม่ผูกกับ login จริง
- **Email** — มี model `ApprovalEmailLog` และ logic ส่งเมลบางส่วน แต่ยังไม่ครบ
- **Database** — ใช้ Supabase ชั่วคราว แผนย้ายไป self-hosted PostgreSQL
