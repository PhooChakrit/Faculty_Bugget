import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "@/features/add-project/types";

interface BudgetTableSectionProps {
  formData: FormData;
}

export function BudgetTableSection({ formData }: BudgetTableSectionProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculateIncomeTotal = () => {
    return (
      Number(formData.incomeSupport || 0) +
      Number(formData.incomeRegistration || 0)
    );
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

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
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
                <tr className="border-t">
                  <td className="p-3">เงินสนับสนุน</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(formData.incomeSupport || 0))}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">ค่าลงทะเบียน</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(formData.incomeRegistration || 0))}
                  </td>
                </tr>
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
                    {formatCurrency(Number(formData.expenseRemuneration || 0))}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดค่าใช้สอย</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(formData.expenseSupplies || 0))}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดค่าวัสดุ</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(formData.expenseMaterials || 0))}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดสาธารณูปโภค</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(formData.expenseUtilities || 0))}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดเงินอุดหนุน</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(formData.expenseSubsidy || 0))}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">หมวดเงินสำรอง</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(formData.expenseReserve || 0))}
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
      </CardContent>
    </Card>
  );
}
