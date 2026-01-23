import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Check } from "lucide-react";
import { Manager } from "../../types";

interface ManagersSectionProps {
  managers: Manager[];
  setManagers: React.Dispatch<React.SetStateAction<Manager[]>>;
}

export function ManagersSection({
  managers,
  setManagers,
}: ManagersSectionProps) {
  const addManager = () => {
    setManagers((prev) => [
      ...prev,
      { id: Date.now(), name: "", position: "" },
    ]);
  };

  const removeManager = (id: number) => {
    if (managers.length > 1) {
      setManagers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3">
        {managers.map((manager, index) => (
          <div
            key={manager.id}
            className="flex items-center gap-3 p-3 border rounded-lg"
          >
            <span className="text-muted-foreground w-6">{index + 1}.</span>
            <Input
              placeholder="ชื่อ นามสกุล"
              value={manager.name}
              onChange={(e) => {
                const newData = [...managers];
                newData[index].name = e.target.value;
                setManagers(newData);
              }}
              className="flex-1"
            />
            <Input
              placeholder="ตำแหน่งหน้าที่ (ถ้ามี)"
              value={manager.position}
              onChange={(e) => {
                const newData = [...managers];
                newData[index].position = e.target.value;
                setManagers(newData);
              }}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 whitespace-nowrap">
                ผู้ลงนาม
              </span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removeManager(manager.id)}
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addManager}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
