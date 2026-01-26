import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "../../types";

interface BudgetTableSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export function BudgetTableSection({
  formData,
  handleChange,
}: BudgetTableSectionProps) {
  // Helpers to calculate totals safely
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
                    <Input
                      readOnly
                      value={calculateIncomeTotal()}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

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
                    <Input
                      readOnly
                      value={calculateExpenseTotal()}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
