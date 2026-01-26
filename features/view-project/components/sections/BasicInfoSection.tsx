import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormData, Collaborator } from "@/features/add-project/types";
import { Separator } from "@/components/ui/separator";

interface BasicInfoSectionProps {
  formData: FormData;
  departmentOptions: { value: string; label: string }[];
  collaborators: Collaborator[];
}

export function BasicInfoSection({
  formData,
  departmentOptions,
  collaborators,
}: BasicInfoSectionProps) {
  const getDepartmentLabel = (value: string) => {
    return departmentOptions.find((opt) => opt.value === value)?.label || value;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">ชื่อโครงการ (ภาษาไทย)</Label>
          <div className="text-base font-medium">
            {formData.projectNameThai || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">ชื่อโครงการภาษาอังกฤษ</Label>
          <div className="text-base">{formData.projectNameEng || "-"}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">ชื่อหัวหน้าโครงการ</Label>
            <div className="text-base">{formData.leaderName || "-"}</div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">ตำแหน่ง</Label>
            <div className="text-base">{formData.leaderPosition || "-"}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">อีเมลหัวหน้าโครงการ</Label>
          <div className="text-base">{formData.leaderEmail || "-"}</div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            หน่วยงาน/ภาควิชาที่รับผิดชอบ
          </Label>
          <div className="text-base">
            {formData.department
              ? getDepartmentLabel(formData.department)
              : "-"}
          </div>
        </div>

        {collaborators.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">ร่วมกับ</Label>
            <div className="space-y-1">
              {collaborators.map((collab, index) => (
                <div key={collab.id} className="text-base">
                  {index + 1}. {collab.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">วันที่เริ่มต้น</Label>
            <div className="text-base">{formatDate(formData.startDate)}</div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">วันที่สิ้นสุด</Label>
            <div className="text-base">{formatDate(formData.endDate)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            ความเป็นมา หลักการและเหตุผล
          </Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.background || "-"}
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

        <div className="space-y-2">
          <Label className="text-muted-foreground">รายละเอียดโครงการ</Label>
          <div className="text-base whitespace-pre-wrap">
            {formData.projectDetails || "-"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
