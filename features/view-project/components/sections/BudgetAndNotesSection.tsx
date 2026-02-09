import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { FormData, Notes, IncomeItem } from "@/features/add-project/types";

interface BudgetAndNotesSectionProps {
  formData: FormData;
  notes: Notes;
}

export function BudgetAndNotesSection({
  formData,
  notes,
}: BudgetAndNotesSectionProps) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (!num || num === 0) return "-";
    return num.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculateBudgetSourceTotal = () => {
    return (
      Number(formData.budgetSourceExtGov || 0) +
      Number(formData.budgetSourceExtPrivate || 0) +
      Number(formData.budgetSourceExtForeign || 0) +
      Number(formData.budgetSourceInternal || 0)
    );
  };

  const calculateIncomeTotal = () => {
    const supportTotal = formData.incomeSupportItems.reduce(
      (sum: number, item: IncomeItem) => sum + Number(item.amount || 0),
      0,
    );
    const registrationTotal = formData.incomeRegistrationItems.reduce(
      (sum: number, item: IncomeItem) => sum + Number(item.amount || 0),
      0,
    );
    return supportTotal + registrationTotal;
  };

  const calculateExpenseTotal = () => {
    return (
      Number(formData.expenseRemuneration || 0) +
      Number(formData.expenseSupplies || 0) +
      Number(formData.expenseMaterials || 0) +
      Number(formData.expenseUtilities || 0) +
      Number(formData.expenseSubsidy || 0) +
      Number(formData.expenseReserve || 0)
    );
  };

  const noteCheckboxItems = [
    {
      key: "note2",
      text: "ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการบริหารคณะฯ ดังนี้ (ถ้ามี)",
    },
    {
      key: "note3",
      text: "ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการการเงิน ดังนี้ (ถ้ามี)",
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Budget Sources Section */}
        <div>
          <h3 className="font-medium mb-3">แหล่งงบประมาณ</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">รายละเอียด</th>
                  <th className="text-right p-3 w-48">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">ภายนอกภาครัฐ</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.budgetSourceExtGov)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">ภายนอกภาคเอกชน</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.budgetSourceExtPrivate)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">ภายนอกต่างประเทศ</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.budgetSourceExtForeign)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">รายได้มหาวิทยาลัย</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.budgetSourceInternal)}
                  </td>
                </tr>
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมงบประมาณ</td>
                  <td className="p-3 text-right">
                    {formatCurrency(calculateBudgetSourceTotal())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        {/* Income Estimates Section */}
        <div>
          <h3 className="font-medium mb-3">ประมาณการรายรับ</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">รายละเอียด</th>
                  <th className="text-right p-3 w-48">
                    งบประมาณที่ตั้งไว้ (บาท)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* เงินสนับสนุน Section */}
                <tr className="border-t bg-gray-50">
                  <td colSpan={2} className="p-3 font-medium text-gray-700">
                    เงินสนับสนุน
                  </td>
                </tr>
                {formData.incomeSupportItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 pl-6">{item.name || "-"}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}

                {/* ค่าลงทะเบียน Section */}
                <tr className="border-t bg-gray-50">
                  <td colSpan={2} className="p-3 font-medium text-gray-700">
                    ค่าลงทะเบียน
                  </td>
                </tr>
                {formData.incomeRegistrationItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 pl-6">{item.name || "-"}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}

                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมประมาณการรายรับ</td>
                  <td className="p-3 text-right">
                    {formatCurrency(calculateIncomeTotal())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        {/* Expense Estimates Section */}
        <div>
          <h3 className="font-medium mb-3">ประมาณการรายจ่าย</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">รายละเอียด</th>
                  <th className="text-right p-3 w-48">
                    งบประมาณที่ตั้งไว้ (บาท)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">หมวดค่าตอบแทน</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.expenseRemuneration)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดค่าใช้สอย</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.expenseSupplies)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดค่าวัสดุ</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.expenseMaterials)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดสาธารณูปโภค</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.expenseUtilities)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดเงินอุดหนุน</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.expenseSubsidy)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดเงินสำรอง</td>
                  <td className="p-3 text-right">
                    {formatCurrency(formData.expenseReserve)}
                  </td>
                </tr>
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมประมาณการรายจ่าย</td>
                  <td className="p-3 text-right">
                    {formatCurrency(calculateExpenseTotal())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="font-medium">หมายเหตุ</h3>
          {/* Plain text notes */}
          <div className="flex items-start space-x-3">
            <span className="text-sm leading-relaxed">
              ขออนุมัติงบประมาณโครงการที่ไม่เป็นไปตามอัตราการเบิกจ่ายตามข้อบังคับจุฬาลงกรณ์ฯ
              ว่าด้วยการให้บริการทางวิชาการ พ.ศ. 2564
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-sm leading-relaxed">
              ขออนุมัติถัวเฉลี่ยทุกรายการ
            </span>
          </div>
          {/* Checkbox notes */}
          {noteCheckboxItems.map((item) => (
            <div key={item.key} className="flex items-start space-x-3">
              <div className="mt-0.5">
                {notes[item.key as keyof Notes] ? (
                  <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded border-2 border-muted-foreground/30" />
                )}
              </div>
              <span className="text-sm leading-relaxed">{item.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
