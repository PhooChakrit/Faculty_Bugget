import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FormData } from "@/features/add-project/types";

interface ClassificationsSectionProps {
  formData: FormData;
  serviceTypeOptions: { value: string; label: string }[];
  targetGroupOptions: { value: string; label: string }[];
  strategyOptions: { value: string; label: string }[];
}

export function ClassificationsSection({
  formData,
  serviceTypeOptions,
  targetGroupOptions,
  strategyOptions,
}: ClassificationsSectionProps) {
  const getServiceTypeLabel = (value: string) => {
    return (
      serviceTypeOptions.find((opt) => opt.value === value)?.label || value
    );
  };

  const getTargetGroupLabels = (values: string[]) => {
    return values
      .map((val) => targetGroupOptions.find((opt) => opt.value === val)?.label)
      .filter(Boolean);
  };

  const getStrategyLabels = (values: string[]) => {
    return values
      .map((val) => strategyOptions.find((opt) => opt.value === val)?.label)
      .filter(Boolean);
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            ประเภทงานบริการวิชาการ
          </Label>
          <div className="text-base">
            {formData.serviceType
              ? getServiceTypeLabel(formData.serviceType)
              : "-"}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">กลุ่มเป้าหมาย</Label>
          {formData.targetGroups && formData.targetGroups.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {getTargetGroupLabels(formData.targetGroups).map((label, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {label}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-base">-</div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground">
            โครงการสอดคล้องกับยุทธศาสตร์/พันธกิจ
          </Label>
          {formData.strategies && formData.strategies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {getStrategyLabels(formData.strategies).map((label, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {label}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-base">-</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
