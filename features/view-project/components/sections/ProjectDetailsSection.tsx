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
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            ความเป็นมา หลักการและเหตุผล
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.background || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">รายละเอียดโครงการ</Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.projectDetails || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">วัตถุประสงค์</Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.objectives || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">ขอบเขตการดำเนินการ</Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.scope || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">แผนการดำเนินการ</Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.implementationPlan || "-"}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              ผู้เข้าร่วม (จำนวนคน)
            </Label>
            <p className="font-medium">
              {formData.participants?.reduce(
                (sum, p) => sum + (parseInt(p.count) || 0),
                0,
              ) || "-"}{" "}
              คน
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              สถานที่จัดโครงการ/อบรม
            </Label>
            <p className="font-medium">{formData.venue || "-"}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">รายละเอียดผู้เข้าร่วม</Label>
          <p className="font-medium whitespace-pre-wrap">
            {formData.participants
              ?.map((p) => p.details)
              .filter(Boolean)
              .join(", ") || "-"}
          </p>
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

        <div className="space-y-2">
          <Label className="text-muted-foreground">การประเมินผลโครงการ</Label>
          <p className="font-medium whitespace-pre-wrap">
            {formData.projectEvaluation || "-"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
