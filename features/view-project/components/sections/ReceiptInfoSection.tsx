import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "@/features/add-project/types";

interface ReceiptInfoSectionProps {
  formData: FormData;
  projectId?: string;
}

export function ReceiptInfoSection({
  formData,
  projectId,
}: ReceiptInfoSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">รหัสโครงการ</Label>
            <div className="text-lg font-medium">{projectId || "-"}</div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">เลขที่รับ วจบ</Label>
            <div className="text-lg font-medium">
              {formData.receiptNumber || "-"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
