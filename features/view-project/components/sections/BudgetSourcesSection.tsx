import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "@/features/add-project/types";

interface BudgetSourcesSectionProps {
  formData: FormData;
}

export function BudgetSourcesSection({ formData }: BudgetSourcesSectionProps) {
  const formatCurrency = (value: string) => {
    if (!value || value === "0") return "-";
    return parseFloat(value).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculateTotal = () => {
    const extGov = parseFloat(formData.budgetSourceExtGov) || 0;
    const extPrivate = parseFloat(formData.budgetSourceExtPrivate) || 0;
    const extForeign = parseFloat(formData.budgetSourceExtForeign) || 0;
    const internal = parseFloat(formData.budgetSourceInternal) || 0;
    return extGov + extPrivate + extForeign + internal;
  };

  const total = calculateTotal();

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
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
                    {total > 0
                      ? total.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "-"}
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
