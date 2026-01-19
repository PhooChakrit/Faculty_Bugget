import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormData } from "../../types";

interface ProjectDetailsSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export function ProjectDetailsSection({
  formData,
  handleChange,
}: ProjectDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>รายละเอียดโครงการ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="background">
            ความเป็นมา หลักการและเหตุผล <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="background"
            name="background"
            value={formData.background}
            onChange={handleChange}
            placeholder="อธิบายความเป็นมาและเหตุผลของโครงการ"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectDetails">รายละเอียดโครงการ</Label>
          <p className="text-sm text-muted-foreground">ไม่เกิน 200 ตัวอักษร</p>
          <Textarea
            id="projectDetails"
            name="projectDetails"
            value={formData.projectDetails}
            onChange={handleChange}
            placeholder="รายละเอียดโครงการโดยย่อ"
            maxLength={200}
            rows={3}
          />
          <p className="text-sm text-muted-foreground text-right">
            {formData.projectDetails.length}/200 ตัวอักษร
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="objectives">
            วัตถุประสงค์ <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="objectives"
            name="objectives"
            value={formData.objectives}
            onChange={handleChange}
            placeholder="ระบุวัตถุประสงค์ของโครงการ"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scope">ขอบเขตการดำเนินการ</Label>
          <Textarea
            id="scope"
            name="scope"
            value={formData.scope}
            onChange={handleChange}
            placeholder="ระบุขอบเขตการดำเนินการ"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="implementationPlan">แผนการดำเนินการ</Label>
          <Textarea
            id="implementationPlan"
            name="implementationPlan"
            value={formData.implementationPlan}
            onChange={handleChange}
            placeholder="ระบุแผนการดำเนินการ"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="committee">คณะกรรมการดำเนินงานโครงการ (ถ้ามี)</Label>
          <Textarea
            id="committee"
            name="committee"
            value={formData.committee}
            onChange={handleChange}
            placeholder="ระบุรายชื่อคณะกรรมการ"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedBenefits">ประโยชน์ที่คาดว่าจะได้รับ</Label>
          <Textarea
            id="expectedBenefits"
            name="expectedBenefits"
            value={formData.expectedBenefits}
            onChange={handleChange}
            placeholder="ระบุประโยชน์ที่คาดว่าจะได้รับ"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
