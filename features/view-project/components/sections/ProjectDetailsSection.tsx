import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FormData } from "@/features/add-project/types";

interface ProjectDetailsSectionProps {
  formData: FormData;
}

export function ProjectDetailsSection({
  formData,
}: ProjectDetailsSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            1. หลักการและเหตุผล (Background)
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.background || "-"}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            2. รายละเอียดโครงการ (Project Details)
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.projectDetails || "-"}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            3. วัตถุประสงค์ (Objectives)
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.objectives || "-"}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            4. ขอบเขตของโครงการ (Scope)
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.scope || "-"}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            5. แผนการดำเนินงาน (Implementation Plan)
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.implementationPlan || "-"}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            6. คณะกรรมการและผู้รับผิดชอบ
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.committee || "-"}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            7. ผลที่คาดว่าจะได้รับ (Expected Benefits)
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.expectedBenefits || "-"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
