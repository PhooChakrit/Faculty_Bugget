import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw } from "lucide-react";
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
  const { setValue } = useFormContext();

  const handleGenerateId = () => {
    const newId = crypto.randomUUID().toUpperCase();
    setValue("receiptNumber", newId, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  useEffect(() => {
    if (!formData.receiptNumber) {
      handleGenerateId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <FileText className="w-32 h-32" />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">ข้อมูลเอกสาร</CardTitle>
            <CardDescription>
              เลขที่รับอ้างอิงโครงการสำหรับใช้ในระบบ
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-w-2xl mt-2">
          <Label
            htmlFor="receiptNumber"
            className="text-sm font-medium text-slate-700"
          >
            เลขที่รับ วจบ.
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="receiptNumber"
              name="receiptNumber"
              value={formData.receiptNumber}
              readOnly
              className="bg-slate-50/50 border-slate-200 font-mono text-slate-600 focus-visible:ring-1 focus-visible:ring-primary/30 flex-1"
              placeholder="ระบบจะสร้างให้อัตโนมัติ"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateId}
              className="gap-2 shrink-0 border-dashed hover:border-primary/50 hover:bg-primary/5"
            >
              <RefreshCw className="h-4 w-4" />
              สร้างใหม่
            </Button>
          </div>
          <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500/60"></span>
            หมายเลขนี้ถูกสร้างขึ้นอัตโนมัติด้วยระบบ UUID เพื่อป้องกันการซ้ำซ้อน
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
