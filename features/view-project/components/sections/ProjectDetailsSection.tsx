import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "../../../add-project/types";

interface ProjectDetailsSectionProps {
  formData: FormData;
}

export function ProjectDetailsSection({
  formData,
}: ProjectDetailsSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              ผู้เข้าร่วม (จำนวนคน)
            </Label>
            <p className="font-medium">{formData.participantCount || "-"} คน</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              สถานที่จัดโครงการ/อบรม
            </Label>
            <p className="font-medium">{formData.venue || "-"}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            คณะกรรมการดำเนินงานโครงการ (ถ้ามี)
          </Label>
          <p className="font-medium whitespace-pre-wrap">
            {formData.committee || "-"}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            ประโยชน์ที่คาดว่าจะได้รับ
          </Label>
          <p className="font-medium whitespace-pre-wrap">
            {formData.expectedBenefits || "-"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
