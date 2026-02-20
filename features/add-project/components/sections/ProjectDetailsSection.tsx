import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { FormData, Participant } from "../../types";

interface ProjectDetailsSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setFormData: (updater: FormData | ((prev: FormData) => FormData)) => void;
}

export function ProjectDetailsSection({
  formData,
  handleChange,
  setFormData,
}: ProjectDetailsSectionProps) {
  const handleParticipantChange = (
    index: number,
    field: keyof Participant,
    value: string,
  ) => {
    setFormData((prev) => {
      const newParticipants = [...(prev.participants || [])];
      newParticipants[index] = { ...newParticipants[index], [field]: value };
      return { ...prev, participants: newParticipants };
    });
  };

  const addParticipant = () => {
    setFormData((prev) => ({
      ...prev,
      participants: [
        ...(prev.participants || []),
        { id: Date.now(), count: "", details: "" },
      ],
    }));
  };

  const removeParticipant = (index: number) => {
    setFormData((prev) => {
      const newParticipants = [...(prev.participants || [])];
      if (newParticipants.length > 1) {
        newParticipants.splice(index, 1);
      }
      return { ...prev, participants: newParticipants };
    });
  };
  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>
              ผู้เข้าร่วม <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addParticipant}
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มผู้เข้าร่วม
            </Button>
          </div>

          {(formData.participants || [{ id: 1, count: "", details: "" }]).map(
            (participant, index) => (
              <div key={participant.id} className="flex items-center gap-3">
                <Input
                  placeholder="รายละเอียด เช่น นักศึกษา, อาจารย์"
                  className="flex-1"
                  value={participant.details}
                  onChange={(e) =>
                    handleParticipantChange(index, "details", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="จำนวน"
                  className="w-32"
                  value={participant.count}
                  onChange={(e) =>
                    handleParticipantChange(index, "count", e.target.value)
                  }
                />
                <span className="text-sm whitespace-nowrap">ท่าน</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParticipant(index)}
                  disabled={(formData.participants?.length || 1) <= 1}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ),
          )}
        </div>

        <Separator />
        <div className="space-y-2">
          <Label htmlFor="venue">
            สถานที่จัดโครงการ/อบรม <span className="text-red-500">*</span>
          </Label>
          <Input
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="committee">
            คณะกรรมการดำเนินงานโครงการ <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="committee"
            name="committee"
            value={formData.committee}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="expectedBenefits">
            ประโยชน์ที่คาดว่าจะได้รับ <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="expectedBenefits"
            name="expectedBenefits"
            value={formData.expectedBenefits}
            onChange={handleChange}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectEvaluation">การประเมินโครงการ (ถ้ามี)</Label>
          <Textarea
            id="projectEvaluation"
            name="projectEvaluation"
            value={formData.projectEvaluation}
            onChange={handleChange}
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
