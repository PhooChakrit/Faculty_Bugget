import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";
import { Collaborator } from "../../types";

interface CollaboratorsSectionProps {
  collaborators: Collaborator[];
  setCollaborators: React.Dispatch<React.SetStateAction<Collaborator[]>>;
}

export function CollaboratorsSection({
  collaborators,
  setCollaborators,
}: CollaboratorsSectionProps) {
  const addCollaborator = () => {
    setCollaborators((prev) => [...prev, { id: Date.now(), name: "" }]);
  };

  const removeCollaborator = (id: number) => {
    if (collaborators.length > 1) {
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ร่วมกับ (ถ้ามี)</CardTitle>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={addCollaborator}
        >
          <Plus className="w-4 h-4 mr-1" /> เพิ่มข้อมูล
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {collaborators.map((collab, index) => (
          <div key={collab.id} className="flex items-center gap-3">
            <span className="text-muted-foreground w-6">{index + 1}.</span>
            <Input
              placeholder="ชื่อหน่วยงาน หรือ บุคคลภายนอก"
              value={collab.name}
              onChange={(e) => {
                const newData = [...collaborators];
                newData[index].name = e.target.value;
                setCollaborators(newData);
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removeCollaborator(collab.id)}
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCollaborator}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
