import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { FormData, Notes } from "../../types";

interface BudgetAndNotesSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  notes: Notes;
  setNotes: React.Dispatch<React.SetStateAction<Notes>>;
}

export function BudgetAndNotesSection({
  formData,
  handleChange,
  notes,
  setNotes,
}: BudgetAndNotesSectionProps) {
  // Helpers to calculate totals safely
  const calculateBudgetSourceTotal = () => {
    return (
      Number(formData.budgetSourceExtGov || 0) +
      Number(formData.budgetSourceExtPrivate || 0) +
      Number(formData.budgetSourceExtForeign || 0) +
      Number(formData.budgetSourceInternal || 0)
    ).toFixed(2);
  };

  const calculateIncomeTotal = () => {
    return (
      Number(formData.incomeSupport || 0) +
      Number(formData.incomeRegistration || 0)
    ).toFixed(2);
  };

  const calculateExpenseTotal = () => {
    return (
      Number(formData.expenseRemuneration || 0) +
      Number(formData.expenseSupplies || 0) +
      Number(formData.expenseMaterials || 0) +
      Number(formData.expenseUtilities || 0) +
      Number(formData.expenseSubsidy || 0) +
      Number(formData.expenseReserve || 0)
    ).toFixed(2);
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Budget Sources Section */}
        <div>
          <h3 className="font-medium mb-3">แหล่งงบประมาณ</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">รายละเอียด</th>
                  <th className="text-left p-3 w-48">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">ภายนอกภาครัฐ</td>
                  <td className="p-3">
                    <Input
                      id="budgetSourceExtGov"
                      name="budgetSourceExtGov"
                      type="number"
                      value={formData.budgetSourceExtGov}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">ภายนอกภาคเอกชน</td>
                  <td className="p-3">
                    <Input
                      id="budgetSourceExtPrivate"
                      name="budgetSourceExtPrivate"
                      type="number"
                      value={formData.budgetSourceExtPrivate}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">ภายนอกต่างประเทศ</td>
                  <td className="p-3">
                    <Input
                      id="budgetSourceExtForeign"
                      name="budgetSourceExtForeign"
                      type="number"
                      value={formData.budgetSourceExtForeign}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">รายได้มหาวิทยาลัย</td>
                  <td className="p-3">
                    <Input
                      id="budgetSourceInternal"
                      name="budgetSourceInternal"
                      type="number"
                      value={formData.budgetSourceInternal}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมงบประมาณ</td>
                  <td className="p-3">
                    <Input readOnly value={calculateBudgetSourceTotal()} />
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
                  <th className="text-left p-3 w-48">
                    งบประมาณที่ตั้งไว้ (บาท)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">เงินสนับสนุน</td>
                  <td className="p-3">
                    <Input
                      id="incomeSupport"
                      name="incomeSupport"
                      type="number"
                      value={formData.incomeSupport}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">ค่าลงทะเบียน</td>
                  <td className="p-3">
                    <Input
                      id="incomeRegistration"
                      name="incomeRegistration"
                      type="number"
                      value={formData.incomeRegistration}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมประมาณการรายรับ</td>
                  <td className="p-3">
                    <Input readOnly value={calculateIncomeTotal()} />
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
                  <th className="text-left p-3 w-48">
                    งบประมาณที่ตั้งไว้ (บาท)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">หมวดค่าตอบแทน</td>
                  <td className="p-3">
                    <Input
                      id="expenseRemuneration"
                      name="expenseRemuneration"
                      type="number"
                      value={formData.expenseRemuneration}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดค่าใช้สอย</td>
                  <td className="p-3">
                    <Input
                      id="expenseSupplies"
                      name="expenseSupplies"
                      type="number"
                      value={formData.expenseSupplies}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดค่าวัสดุ</td>
                  <td className="p-3">
                    <Input
                      id="expenseMaterials"
                      name="expenseMaterials"
                      type="number"
                      value={formData.expenseMaterials}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดสาธารณูปโภค</td>
                  <td className="p-3">
                    <Input
                      id="expenseUtilities"
                      name="expenseUtilities"
                      type="number"
                      value={formData.expenseUtilities}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดเงินอุดหนุน</td>
                  <td className="p-3">
                    <Input
                      id="expenseSubsidy"
                      name="expenseSubsidy"
                      type="number"
                      value={formData.expenseSubsidy}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดเงินสำรอง</td>
                  <td className="p-3">
                    <Input
                      id="expenseReserve"
                      name="expenseReserve"
                      type="number"
                      value={formData.expenseReserve}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมประมาณการรายจ่าย</td>
                  <td className="p-3">
                    <Input readOnly value={calculateExpenseTotal()} />
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
          <div className="flex items-start space-x-3">
            <Checkbox
              id="note1"
              checked={notes.note1}
              onCheckedChange={(checked) =>
                setNotes((prev) => ({
                  ...prev,
                  note1: checked as boolean,
                }))
              }
            />
            <label htmlFor="note1" className="text-sm leading-relaxed">
              ขออนุมัติงบประมาณโครงการที่ไม่เป็นไปตามอัตราการเบิกจ่ายตามข้อบังคับจุฬาลงกรณ์ฯ
              ว่าด้วยการให้บริการทางวิชาการ พ.ศ. 2564
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="note2"
              checked={notes.note2}
              onCheckedChange={(checked) =>
                setNotes((prev) => ({
                  ...prev,
                  note2: checked as boolean,
                }))
              }
            />
            <label htmlFor="note2" className="text-sm leading-relaxed">
              ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการบริหารคณะฯ ดังนี้ (ถ้ามี)
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="note3"
              checked={notes.note3}
              onCheckedChange={(checked) =>
                setNotes((prev) => ({
                  ...prev,
                  note3: checked as boolean,
                }))
              }
            />
            <label htmlFor="note3" className="text-sm leading-relaxed">
              ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการการเงิน ดังนี้ (ถ้ามี)
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="note4"
              checked={notes.note4}
              onCheckedChange={(checked) =>
                setNotes((prev) => ({
                  ...prev,
                  note4: checked as boolean,
                }))
              }
            />
            <label htmlFor="note4" className="text-sm leading-relaxed">
              ขออนุมัติถัวเฉลี่ยทุกรายการ
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
