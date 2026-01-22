import { Card, CardContent } from "@/components/ui/card";
import { Manager } from "@/features/add-project/types";

interface ManagersSectionProps {
  managers: Manager[];
}

export function ManagersSection({ managers }: ManagersSectionProps) {
  const hasManagers = managers.some(
    (m) => m.name.trim() !== "" || m.position.trim() !== "",
  );

  return (
    <Card>
      <CardContent>
        {hasManagers ? (
          <div className="space-y-3">
            {managers
              .filter((m) => m.name.trim() !== "" || m.position.trim() !== "")
              .map((manager, index) => (
                <div key={manager.id} className="flex items-start gap-3">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="text-base">{manager.name || "-"}</div>
                    {manager.position && (
                      <div className="text-sm text-muted-foreground">
                        {manager.position}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">ไม่มีข้อมูล</p>
        )}
      </CardContent>
    </Card>
  );
}
