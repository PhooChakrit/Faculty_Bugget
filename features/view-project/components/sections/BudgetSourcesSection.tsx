import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "@/features/add-project/types";

interface BudgetSourcesSectionProps {
  formData: FormData;
}

export function BudgetSourcesSection({ formData }: BudgetSourcesSectionProps) {
  const formatCurrency = (value: string) => {
    if (!value || value === "0") return "-";
    return `${parseFloat(value).toLocaleString("th-TH")} บาท`;
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
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <Label className="text-muted-foreground">
              แหล่งทุนภายนอกภาครัฐ
            </Label>
            <div className="text-base font-medium">
              {formatCurrency(formData.budgetSourceExtGov)}
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <Label className="text-muted-foreground">
              แหล่งทุนภายนอกภาคเอกชน
            </Label>
            <div className="text-base font-medium">
              {formatCurrency(formData.budgetSourceExtPrivate)}
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <Label className="text-muted-foreground">
              แหล่งทุนภายนอกต่างประเทศ
            </Label>
            <div className="text-base font-medium">
              {formatCurrency(formData.budgetSourceExtForeign)}
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <Label className="text-muted-foreground">
              แหล่งทุนภายในมหาวิทยาลัย
            </Label>
            <div className="text-base font-medium">
              {formatCurrency(formData.budgetSourceInternal)}
            </div>
          </div>

          <div className="flex justify-between items-center py-3 bg-muted px-3 rounded-md">
            <Label className="font-semibold">รวมทั้งหมด</Label>
            <div className="text-base font-bold">
              {total > 0 ? `${total.toLocaleString("th-TH")} บาท` : "-"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
