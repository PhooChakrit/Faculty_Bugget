import { Card, CardContent } from "@/components/ui/card";
import { FormData, IncomeItem } from "@/features/add-project/types";

interface BudgetTableSectionProps {
  formData: FormData;
}

export function BudgetTableSection({ formData }: BudgetTableSectionProps) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (!num || num === 0) return "-";
    return num.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
      </CardContent>
    </Card>
  );
}
