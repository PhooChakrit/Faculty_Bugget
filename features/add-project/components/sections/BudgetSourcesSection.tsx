import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader>
        <CardTitle>แหล่งที่มางบประมาณ</CardTitle>
        <p className="text-sm text-muted-foreground">
          สามารถกรอกได้มากสุด 4 แหล่งงบประมาณ
          <br />
          กรณีงบประมาณจากภายนอกต่างประเทศ ต้องแปลงงบประมาณเป็นเงินบาท
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budgetSourceExtGov">ภายนอกภาครัฐ</Label>
            <Input
              id="budgetSourceExtGov"
              name="budgetSourceExtGov"
              type="number"
              value={formData.budgetSourceExtGov}
              onChange={handleChange}
              placeholder="จำนวนเงิน (บาท)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetSourceExtPrivate">ภายนอกภาคเอกชน</Label>
            <Input
              id="budgetSourceExtPrivate"
              name="budgetSourceExtPrivate"
              type="number"
              value={formData.budgetSourceExtPrivate}
              onChange={handleChange}
              placeholder="จำนวนเงิน (บาท)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetSourceExtForeign">ภายนอกต่างประเทศ</Label>
            <Input
              id="budgetSourceExtForeign"
              name="budgetSourceExtForeign"
              type="number"
              value={formData.budgetSourceExtForeign}
              onChange={handleChange}
              placeholder="จำนวนเงิน (บาท)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetSourceInternal">รายได้มหาวิทยาลัย</Label>
            <Input
              id="budgetSourceInternal"
              name="budgetSourceInternal"
              type="number"
              value={formData.budgetSourceInternal}
              onChange={handleChange}
              placeholder="จำนวนเงิน (บาท)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
