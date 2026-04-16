import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface ReceiptInfoSectionProps {
  projectId?: string;
}

export function ReceiptInfoSection({ projectId }: ReceiptInfoSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">รหัสโครงการ</Label>
          <div className="text-lg font-medium">{projectId || "-"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
