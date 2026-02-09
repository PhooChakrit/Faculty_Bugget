import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Manager } from "@/features/add-project/types";
import { Label } from "@/components/ui/label";

interface ManagersSectionProps {
  managers: Manager[];
}

export function ManagersSection({ managers }: ManagersSectionProps) {
  if (managers.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h3 className="font-medium">รายชื่อผู้ลงนาม (Managers)</h3>
        <div className="space-y-3">
          {managers.map((manager, index) => (
            <div
              key={manager.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50"
            >
              <span className="text-muted-foreground w-6">{index + 1}.</span>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    ชื่อ-นามสกุล
                  </Label>
                  <p className="font-medium">{manager.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    ตำแหน่ง
                  </Label>
                  <p className="font-medium">{manager.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 whitespace-nowrap">
                  ผู้ลงนาม
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
