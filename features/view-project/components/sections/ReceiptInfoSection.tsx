import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "@/features/add-project/types";

interface ReceiptInfoSectionProps {
  formData: FormData;
}

export function ReceiptInfoSection({ formData }: ReceiptInfoSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">เลขที่รับ วจบ</Label>
          <div className="text-lg font-medium">
            {formData.receiptNumber || "-"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
