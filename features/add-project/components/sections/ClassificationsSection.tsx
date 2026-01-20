import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelectField } from "../MultiSelectField";
import { FormData } from "../../types";

interface ClassificationsSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  serviceTypeOptions: { value: string; label: string }[];
  targetGroupOptions: { value: string; label: string }[];
  strategyOptions: { value: string; label: string }[];
}

export function ClassificationsSection({
  formData,
  setFormData,
  serviceTypeOptions,
  targetGroupOptions,
  strategyOptions,
}: ClassificationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>การจำแนกประเภท</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>ประเภทงานบริการวิชาการ</Label>
          <p className="text-sm text-muted-foreground">
            สามารถเลือกอย่างใดอย่างหนึ่ง
          </p>
          <Select
            value={formData.serviceType}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, serviceType: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="เลือกประเภท..." />
            </SelectTrigger>
            <SelectContent>
              {serviceTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <MultiSelectField
          label="กลุ่มเป้าหมาย"
          options={targetGroupOptions}
          value={formData.targetGroups}
          onChange={(values) =>
            setFormData((prev) => ({ ...prev, targetGroups: values }))
          }
          maxSelections={4}
          hint="สามารถเลือกได้หลายข้อ (มากสุด 4 ข้อ)"
        />

        <Separator />

        <MultiSelectField
          label="โครงการสอดคล้องกับยุทธศาสตร์/พันธกิจ"
          options={strategyOptions}
          value={formData.strategies}
          onChange={(values) =>
            setFormData((prev) => ({ ...prev, strategies: values }))
          }
          maxSelections={5}
          hint="สามารถเลือกได้หลายข้อ (มากสุด 5 ข้อ)"
        />
      </CardContent>
    </Card>
  );
}
