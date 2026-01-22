import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "@/features/add-project/types";

interface DatesVenueSectionProps {
  formData: FormData;
}

export function DatesVenueSection({ formData }: DatesVenueSectionProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4">
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
          <Label className="text-muted-foreground">สถานที่</Label>
          <div className="text-base">{formData.venue || "-"}</div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">จำนวนผู้เข้าร่วม</Label>
          <div className="text-base">
            {formData.participantCount
              ? `${formData.participantCount} คน`
              : "-"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
