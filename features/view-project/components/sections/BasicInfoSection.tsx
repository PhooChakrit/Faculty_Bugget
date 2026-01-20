import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormData } from "@/features/add-project/types";
import { Badge } from "@/components/ui/badge";

interface BasicInfoSectionProps {
  formData: FormData;
  departmentOptions: { value: string; label: string }[];
}

export function BasicInfoSection({
  formData,
  departmentOptions,
}: BasicInfoSectionProps) {
  const getDepartmentLabel = (value: string) => {
    return (
      departmentOptions.find((opt) => opt.value === value)?.label || value
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground">เลขที่รับ วจบ</Label>
          <div className="text-base">
            {formData.receiptNumber || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">ชื่อโครงการ (ภาษาไทย)</Label>
          <div className="text-base font-medium">
            {formData.projectNameThai || "-"}
          </div>
        </div>

        {formData.projectNameEng && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              ชื่อโครงการภาษาอังกฤษ
            </Label>
            <div className="text-base">{formData.projectNameEng}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">ชื่อหัวหน้าโครงการ</Label>
            <div className="text-base">{formData.leaderName || "-"}</div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">ตำแหน่ง</Label>
            <div className="text-base">
              {formData.leaderPosition || "-"}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">ภาควิชา/หน่วยงาน</Label>
          <div className="text-base">
            {formData.department ? getDepartmentLabel(formData.department) : "-"}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">อีเมล</Label>
          <div className="text-base">{formData.leaderEmail || "-"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
