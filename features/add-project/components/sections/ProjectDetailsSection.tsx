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
        <div className="space-y-2">
          <Label>ผู้เข้าร่วม</Label>
          <div className="flex items-center gap-3">
            <Input
              id="participantCount"
              name="participantCount"
              type="number"
              className="flex-1"
              value={formData.participantCount}
              onChange={handleChange}
            />
            <span className="text-sm whitespace-nowrap">จำนวน</span>
            <Input
              id="venue"
              name="venue"
              className="flex-1"
              value={formData.venue}
              onChange={handleChange}
            />
            <span className="text-sm whitespace-nowrap">ท่าน</span>
          </div>
        </div>

        <Separator />
        <div className="space-y-2">
          <Label htmlFor="venue">สถานที่จัดโครงการ/อบรม <span className="text-red-500">*</span></Label>
          <Input
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="committee">คณะกรรมการดำเนินงานโครงการ <span className="text-red-500">*</span></Label>
          <Textarea
            id="committee"
            name="committee"
            value={formData.committee}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="expectedBenefits">ประโยชน์ที่คาดว่าจะได้รับ <span className="text-red-500">*</span></Label>
          <Textarea
            id="expectedBenefits"
            name="expectedBenefits"
            value={formData.expectedBenefits}
            onChange={handleChange}
            rows={4}
          />
        </div>
                <div className="space-y-2">
          <Label htmlFor="expectedBenefits">ประโยชน์ที่คาดว่าจะได้รับ <span className="text-red-500">*</span></Label>
          <Textarea
            id="expectedBenefits"
            name="expectedBenefits"
            value={formData.expectedBenefits}
            onChange={handleChange}
            rows={4}
          />
        </div>        
        <div className="space-y-2">
          <Label htmlFor="expectedBenefits">การประเมินโครงการ (ถ้ามี)</Label>
          <Textarea
            id="expectedBenefits"
            name="expectedBenefits"
            value={formData.expectedBenefits}
            onChange={handleChange}
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
