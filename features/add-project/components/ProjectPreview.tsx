import * as React from "react";
import { Button } from "@/components/ui/button";
import { FormData, Collaborator, Notes } from "../types";
import {
  departmentOptions,
  serviceTypeOptions,
  strategyOptions,
  targetGroupOptions,
} from "../constants";

interface ProjectPreviewProps {
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  formData: FormData;
  collaborators: Collaborator[];
  notes: Notes;
}

export function ProjectPreview({
  onCancel,
  onConfirm,
  isSubmitting,
  formData,
  collaborators,
  notes,
}: ProjectPreviewProps) {
  const getLabel = (
    value: string,
    options: { value: string; label: string }[],
  ) => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  const getLabels = (
    values: string[],
    options: { value: string; label: string }[],
  ) => {
    return values.map((val) => getLabel(val, options)).join(", ");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">ตรวจสอบข้อมูลก่อนบันทึก</h2>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            แก้ไขข้อมูล
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันส่งข้อมูล"}
          </Button>
        </div>
      </div>

      <div className="space-y-6 text-sm">
        <Section title="ข้อมูลรายรับ">
          <Row label="เลขที่รับ วจบ" value={formData.receiptNumber || "-"} />
        </Section>

        <Section title="ข้อมูลพื้นฐาน">
          <Row label="ชื่อโครงการภาษาไทย" value={formData.projectNameThai} />
          <Row label="ชื่อโครงการภาษาอังกฤษ" value={formData.projectNameEng} />
          <Row
            label="ชื่อหัวหน้าโครงการ"
            value={`${formData.leaderName}${formData.leaderPosition ? ` (${formData.leaderPosition})` : ""}${formData.leaderEmail ? ` - ${formData.leaderEmail}` : ""}`}
          />
          {formData.coLeaderName && (
            <Row
              label="ชื่อผู้ประสานโครงการ"
              value={`${formData.coLeaderName}${formData.coLeaderEmail ? ` - ${formData.coLeaderEmail}` : ""}`}
            />
          )}
          <Row
            label="หน่วยงาน/ภาควิชาที่รับผิดชอบ"
            value={getLabel(formData.department, departmentOptions)}
          />
          <Row
            label="ร่วมกับ (ถ้ามี)"
            value={
              collaborators
                .map((c) => c.name)
                .filter(Boolean)
                .join(", ") || "-"
            }
          />
          <Row
            label="วันที่จัดโครงการ"
            value={`${formData.startDate} ${formData.endDate ? `ถึง ${formData.endDate}` : ""}`}
          />
        </Section>

        <Section title="การจัดประเภทโครงการ">
          <Row
            label="ประเภทงานบริการวิชาการ"
            value={getLabel(formData.serviceType, serviceTypeOptions)}
          />
          <Row
            label="กลุ่มเป้าหมาย"
            value={getLabels(formData.targetGroups, targetGroupOptions) || "-"}
          />
          <Row
            label="โครงการสอดคล้องกับยุทธศาสตร์/พันธกิจ"
            value={getLabels(formData.strategies, strategyOptions) || "-"}
          />
        </Section>

        <Section title="รายละเอียดโครงการ">
          <Row
            label="ความเป็นมา หลักการและเหตุผล"
            value={formData.background}
          />
          <Row label="วัตถุประสงค์" value={formData.objectives} />
          <Row label="ขอบเขตการดำเนินการ" value={formData.scope} />
          <Row
            label="ขั้นตอนการดำเนินการ"
            value={formData.implementationPlan}
          />
          <Row label="รายละเอียดโครงการ" value={formData.projectDetails} />
          <Row
            label="ผู้เข้าร่วม"
            value={
              formData.participants
                ?.map(
                  (p) => `${p.count} ท่าน${p.details ? ` (${p.details})` : ""}`,
                )
                .join(", ") || "-"
            }
          />
          <Row label="สถานที่จัดโครงการ/อบรม" value={formData.venue} />
          <Row label="คณะกรรมการดำเนินงานโครงการ" value={formData.committee} />
          <Row
            label="ประโยชน์ที่คาดว่าจะได้รับ"
            value={formData.expectedBenefits}
          />
          <Row
            label="การประเมินโครงการ (ถ้ามี)"
            value={formData.projectEvaluation}
          />
        </Section>

        <Section title="แหล่งงบประมาณ">
          <Row label="ภายนอกภาครัฐ" value={formData.budgetSourceExtGov} />
          <Row label="ภายนอกภาคเอกชน" value={formData.budgetSourceExtPrivate} />
          <Row
            label="ภายนอกต่างประเทศ"
            value={formData.budgetSourceExtForeign}
          />
          <Row
            label="รายได้มหาวิทยาลัย"
            value={formData.budgetSourceInternal}
          />

          <div className="font-semibold mt-4 mb-2 text-slate-700">
            ประมาณการรายรับ
          </div>
          {formData.incomeSupportItems &&
            formData.incomeSupportItems.length > 0 &&
            formData.incomeSupportItems[0].name && (
              <Row
                label="เงินสนับสนุน"
                value={formData.incomeSupportItems
                  .map((i) => `${i.name}: ${i.amount} บาท`)
                  .join(", ")}
              />
            )}

          {formData.incomeRegistrationItems &&
            formData.incomeRegistrationItems.length > 0 &&
            formData.incomeRegistrationItems[0].name && (
              <Row
                label="ค่าลงทะเบียน"
                value={formData.incomeRegistrationItems
                  .map((i) => `${i.name}: ${i.amount} บาท`)
                  .join(", ")}
              />
            )}

          <div className="font-semibold mt-4 mb-2 text-slate-700">
            ประมาณการรายจ่าย
          </div>
          <Row label="หมวดค่าตอบแทน" value={formData.expenseRemuneration} />
          <Row label="หมวดค่าใช้สอย" value={formData.expenseSupplies} />
          <Row label="หมวดค่าวัสดุ" value={formData.expenseMaterials} />
          <Row label="หมวดสาธารณูปโภค" value={formData.expenseUtilities} />
          <Row label="หมวดเงินอุดหนุน" value={formData.expenseSubsidy} />
          <Row label="หมวดเงินสำรอง" value={formData.expenseReserve} />

          {(notes.note2 || notes.note3) && (
            <div className="font-semibold mt-4 mb-2 text-slate-700">
              หมายเหตุ
            </div>
          )}
          {notes.note2 && (
            <Row
              label="หมายเหตุ 3"
              value="ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการบริหารคณะฯ ดังนี้ (ถ้ามี)"
            />
          )}
          {notes.note3 && (
            <Row
              label="หมายเหตุ 4"
              value="ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการการเงิน ดังนี้ (ถ้ามี)"
            />
          )}
        </Section>

        <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            แก้ไขข้อมูล
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันส่งข้อมูล"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const hasContent = React.Children.toArray(children).some((child) => !!child);
  if (!hasContent) return null;

  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm">
      <h3 className="font-semibold text-lg text-slate-800 mb-4 pb-2 border-b">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === "") return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 border-b border-slate-50 last:border-0 pb-3 last:pb-0 text-slate-600">
      <div className="font-medium text-slate-700 md:col-span-1">{label}</div>
      <div className="md:col-span-3 whitespace-pre-wrap break-words min-w-0">
        {value}
      </div>
    </div>
  );
}
