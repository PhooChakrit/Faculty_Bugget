import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
      <CardContent className="space-y-4">
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
