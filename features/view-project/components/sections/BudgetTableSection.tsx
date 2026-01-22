import { Card, CardContent } from "@/components/ui/card";

export function BudgetTableSection() {
  // Mock data for display - in real app, this would come from props
  const incomeItems = [
    { label: "เงินสนับสนุน", amount: 70000 },
    { label: "ค่าลงทะเบียน", amount: 30000 },
  ];

  const expenseItems = [
    { label: "หมวดค่าตอบแทน", amount: 20000 },
    { label: "หมวดค่าใช้สอย", amount: 30000 },
    { label: "หมวดค่าวัสดุ", amount: 25000 },
    { label: "หมวดสาธารณูปโภค", amount: 10000 },
    { label: "หมวดเงินอุดหนุน", amount: 10000 },
    { label: "หมวดเงินสำรอง", amount: 5000 },
  ];

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
                  <th className="text-right p-3 w-48">
                    งบประมาณที่ตั้งไว้ (บาท)
                  </th>
                </tr>
              </thead>
              <tbody>
                {incomeItems.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{item.label}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมประมาณการรายรับ</td>
                  <td className="p-3 text-right">
                    {formatCurrency(totalIncome)}
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
                {expenseItems.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{item.label}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมประมาณการรายจ่าย</td>
                  <td className="p-3 text-right">
                    {formatCurrency(totalExpense)}
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
