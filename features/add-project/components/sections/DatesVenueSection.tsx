import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormData } from "../../types";

interface DatesVenueSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export function DatesVenueSection({
  formData,
  handleChange,
}: DatesVenueSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ระยะเวลาและสถานที่</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">
              วันที่เริ่มต้น <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">
              วันที่สิ้นสุด <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="participantCount">ผู้เข้าร่วม (จำนวนคน)</Label>
          <Input
            id="participantCount"
            name="participantCount"
            type="number"
            value={formData.participantCount}
            onChange={handleChange}
            placeholder="ระบุจำนวนคน"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue">สถานที่จัดโครงการ/อบรม</Label>
          <Input
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            placeholder="ระบุสถานที่"
          />
        </div>
      </CardContent>
    </Card>
  );
}
