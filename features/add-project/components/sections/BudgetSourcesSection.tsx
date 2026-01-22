import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "../../types";

interface BudgetSourcesSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export function BudgetSourcesSection({
  formData,
  handleChange,
}: BudgetSourcesSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                      placeholder="0.00"
                    />
                  </td>
                </tr>
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมแหล่งงบประมาณ</td>
                  <td className="p-3">
                    <Input
                      readOnly
                      value={(
                        Number(formData.budgetSourceExtGov || 0) +
                        Number(formData.budgetSourceExtPrivate || 0) +
                        Number(formData.budgetSourceExtForeign || 0) +
                        Number(formData.budgetSourceInternal || 0)
                      ).toFixed(2)}
                      placeholder="0.00"
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
