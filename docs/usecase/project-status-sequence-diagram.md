# Project Status Sequence Diagram

อ้างอิง state diagram และข้อสรุปจากการคุยล่าสุด: workflow หลักใช้ state `DRAFT, 0, 1, 2, 3, 4, 5, 6, 7, 13` โดย `8/9/10` ไม่ใช่เส้นทางหลักใหม่

## Overview

```mermaid
flowchart LR
    D["DRAFT<br/>เจ้าของโครงการจัดทำ"] --> S0["STATUS_0<br/>เสนอหัวหน้าภาค"]
    S0 --> S1["STATUS_1<br/>งานวิจัยตรวจสอบ"]
    S1 --> S2["STATUS_2<br/>หัวหน้าฝ่ายวิจัยพิจารณา"]
    S2 --> S1
    S2 --> S3["STATUS_3<br/>รอ/เสนอเข้าที่ประชุม"]
    S3 -->|"ผ่านมติคณะกรรมการฯ"| S4["STATUS_4<br/>รอข้อมูลหลังมติ"]
    S3 -->|"ผ่านมติคณบดี"| S5["STATUS_5<br/>รอข้อมูลหลังมติ/อนุมัติพิเศษ"]
    S4 -->|"Vendor + ศูนย์ต้นทุนครบ<br/>งานวิจัยปล่อยดำเนินการ"| S6["STATUS_6<br/>ดำเนินโครงการได้"]
    S5 -->|"Vendor + ศูนย์ต้นทุน + ไฟล์คณบดีครบ<br/>งานวิจัยปล่อยดำเนินการ"| S7["STATUS_7<br/>ดำเนินโครงการได้"]
    S6 -->|"รายงาน + RESEARCH/PHYSICAL/FINANCE ครบ"| S13["STATUS_13<br/>ปิดโครงการ"]
    S7 -->|"รายงาน + RESEARCH/PHYSICAL/FINANCE ครบ"| S13
```

## Role Sequence

```mermaid
sequenceDiagram
    participant Owner as เจ้าของโครงการ
    participant DeptHead as หัวหน้าภาควิชา
    participant Research as งานวิจัย
    participant ResearchHead as หัวหน้าฝ่ายวิจัย
    participant Plan as งานแผน
    participant Finance as งานคลัง
    participant Physical as กายภาพ

    Owner->>DeptHead: ยื่นเสนอจาก DRAFT เป็น STATUS_0
    DeptHead->>Research: อนุมัติส่งงานวิจัยเป็น STATUS_1
    Research->>Research: ตรวจสอบ/แก้ไข และกดตรวจสอบแล้ว
    Research->>ResearchHead: ส่งต่อเป็น STATUS_2
    ResearchHead->>Research: อนุมัติเข้าที่ประชุมเป็น STATUS_3

    alt ผ่านมติคณะกรรมการบริหารคณะวิทยาศาสตร์
        Research->>Research: บันทึกมติคณะกรรมการฯ และเปลี่ยนเป็น STATUS_4
        Finance->>Research: กรอก Vendor
        Plan->>Research: กรอกศูนย์ต้นทุน
        Research->>Owner: ปล่อยดำเนินโครงการและออก projectCode เป็น STATUS_6
    else ผ่านมติคณบดี / อนุมัติพิเศษ
        Research->>Research: บันทึกมติคณะกรรมการฯ/คณบดี และเปลี่ยนเป็น STATUS_5
        Finance->>Research: กรอก Vendor
        Plan->>Research: กรอกศูนย์ต้นทุน
        Research->>Research: แนบไฟล์/ลิงก์อนุมัติคณบดี
        Research->>Owner: ปล่อยดำเนินโครงการและออก projectCode เป็น STATUS_7
    end

    Owner->>Research: ส่งรายงานดำเนินโครงการ
    Physical->>Research: กรอกค่าบำรุงสถานที่/ค่าไฟ และยืนยันครบ
    Finance->>Research: ยืนยันปิดการเงิน
    Research->>Owner: ปิดโครงการเป็น STATUS_13
```

## Budget Revision Sub-flow

```mermaid
flowchart LR
    BR0["BR_DRAFT<br/>เจ้าของกรอกคำขอ"] --> BR1["BR_SUBMITTED<br/>งานวิจัยตรวจ"]
    BR1 --> BR2["BR_RESEARCH_CHECKED<br/>หัวหน้าฝ่ายวิจัยพิจารณา"]
    BR2 --> BR3["BR_WAITING_MEETING<br/>รอมติแก้งบ"]
    BR3 -->|"ผ่านมติแก้งบตามเกณฑ์"| BR4["BR_BOARD_APPROVED<br/>รอ apply"]
    BR3 -->|"ผ่านมติแก้งบแบบอนุมัติพิเศษ"| BR5["BR_DEAN_APPROVED<br/>รอ apply"]
    BR4 --> BR6["BR_APPLIED<br/>อัปเดตงบหลัก"]
    BR5 --> BR6
```

เมื่อ apply สายอนุมัติพิเศษ หาก project เดิมอยู่ `STATUS_6` ให้เปลี่ยนเป็น `STATUS_7`; หากเป็นสายตามเกณฑ์ ให้ project คง route เดิม
