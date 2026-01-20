import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collaborator } from "@/features/add-project/types";

interface CollaboratorsSectionProps {
  collaborators: Collaborator[];
}

export function CollaboratorsSection({
  collaborators,
}: CollaboratorsSectionProps) {
  const hasCollaborators = collaborators.some((c) => c.name.trim() !== "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>ร่วมกับ</CardTitle>
      </CardHeader>
      <CardContent>
        {hasCollaborators ? (
          <div className="space-y-2">
            {collaborators
              .filter((c) => c.name.trim() !== "")
              .map((collab, index) => (
                <div key={collab.id} className="flex items-start gap-3">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span className="text-base">{collab.name}</span>
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
