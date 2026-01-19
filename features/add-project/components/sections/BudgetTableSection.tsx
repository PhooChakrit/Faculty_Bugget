import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BudgetTableSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>งบประมาณรายรับ-รายจ่าย</CardTitle>
      </CardHeader>
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
                    <Input type="number" placeholder="0.00" />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">ค่าลงทะเบียน</td>
                  <td className="p-3">
                    <Input type="number" placeholder="0.00" />
                  </td>
                </tr>
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมประมาณการรายรับ</td>
                  <td className="p-3">
                    <Input type="number" placeholder="0.00" readOnly />
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
                {[
                  "หมวดค่าตอบแทน",
                  "หมวดค่าใช้สอย",
                  "หมวดค่าวัสดุ",
                  "หมวดสาธารณูปโภค",
                  "หมวดเงินอุดหนุน",
                  "หมวดเงินสำรอง",
                ].map((item) => (
                  <tr key={item} className="border-t">
                    <td className="p-3">{item}</td>
                    <td className="p-3">
                      <Input type="number" placeholder="0.00" />
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-muted font-medium">
                  <td className="p-3">รวมประมาณการรายจ่าย</td>
                  <td className="p-3">
                    <Input type="number" placeholder="0.00" readOnly />
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
