import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelect } from "@/components/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
              <SelectValue />
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

        <MultiSelect
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

        <div className="space-y-4">
          <Label>โครงการสอดคล้องกับยุทธศาสตร์/พันธกิจ</Label>
          <RadioGroup
            value={
              !formData.strategies.includes("0")
                ? "consistent"
                : "not-consistent"
            }
            onValueChange={(value) => {
              if (value === "not-consistent") {
                setFormData((prev) => ({ ...prev, strategies: ["0"] }));
              } else {
                setFormData((prev) => ({ ...prev, strategies: [] }));
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not-consistent" id="r1" />
              <Label htmlFor="r1">ไม่สอดคล้องกับยุทธศาสตร์ใด ๆ</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="consistent" id="r2" />
              <Label htmlFor="r2">สอดคล้องกับยุทธศาสตร์ส่วนงาน</Label>
            </div>
          </RadioGroup>

          {!formData.strategies.includes("0") && (
            <div className="pl-6">
              <MultiSelect
                options={strategyOptions.filter(
                  (opt) => opt.value !== "0" && opt.value !== "5",
                )}
                value={formData.strategies}
                onChange={(values) =>
                  setFormData((prev) => ({ ...prev, strategies: values }))
                }
                maxSelections={5}
                hint="สามารถเลือกได้หลายข้อ"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
