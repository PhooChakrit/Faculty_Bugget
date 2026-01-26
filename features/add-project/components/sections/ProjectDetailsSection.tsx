import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
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
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="participantCount">ผู้เข้าร่วม (จำนวนคน)</Label>
            <Input
              id="participantCount"
              name="participantCount"
              type="number"
              placeholder="ระบุจำนวนผู้เข้าร่วม"
              value={formData.participantCount}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">สถานที่จัดโครงการ/อบรม</Label>
            <Input
              id="venue"
              name="venue"
              placeholder="ระบุสถานที่จัดโครงการ"
              value={formData.venue}
              onChange={handleChange}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="committee">คณะกรรมการดำเนินงานโครงการ (ถ้ามี)</Label>
          <Textarea
            id="committee"
            name="committee"
            placeholder="ระบุรายชื่อคณะกรรมการดำเนินงาน (ถ้ามี)"
            value={formData.committee}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="expectedBenefits">ประโยชน์ที่คาดว่าจะได้รับ</Label>
          <Textarea
            id="expectedBenefits"
            name="expectedBenefits"
            placeholder="ระบุประโยชน์ที่คาดว่าจะได้รับจากโครงการ"
            value={formData.expectedBenefits}
            onChange={handleChange}
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
