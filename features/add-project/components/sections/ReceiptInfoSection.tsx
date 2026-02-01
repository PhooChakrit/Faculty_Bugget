import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "../../types";

interface ReceiptInfoSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export function ReceiptInfoSection({
  formData,
  handleChange,
}: ReceiptInfoSectionProps) {
  return (
    <Card>
      <CardContent className="">
        <div className="space-y-2">
          <Label htmlFor="receiptNumber">เลขที่รับ วจบ</Label>
          <Input
            id="receiptNumber"
            name="receiptNumber"
            value={formData.receiptNumber}
            onChange={handleChange}
            placeholder="กรอกเลขที่รับ วจบ"
          />
        </div>
      </CardContent>
    </Card>
  );
}
