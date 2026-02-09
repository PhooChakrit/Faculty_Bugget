import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Notes } from "../../types";

interface NotesSectionProps {
  notes: Notes;
  setNotes: React.Dispatch<React.SetStateAction<Notes>>;
}

export function NotesSection({ notes, setNotes }: NotesSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <h1 className="">หมายเหตุ</h1>
        {/* Plain text notes */}
        <div className="flex items-start space-x-3">
          <label className="text-sm leading-relaxed">
            ขออนุมัติงบประมาณโครงการที่ไม่เป็นไปตามอัตราการเบิกจ่ายตามข้อบังคับจุฬาลงกรณ์ฯ
            ว่าด้วยการให้บริการทางวิชาการ พ.ศ. 2564
          </label>
        </div>

        <div className="flex items-start space-x-3">
          <label className="text-sm leading-relaxed">
            ขออนุมัติถัวเฉลี่ยทุกรายการ
          </label>
        </div>

        {/* Checkbox notes */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="note2"
            checked={notes.note2}
            onCheckedChange={(checked) =>
              setNotes((prev) => ({
                ...prev,
                note2: checked as boolean,
              }))
            }
          />
          <label htmlFor="note2" className="text-sm leading-relaxed">
            ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการบริหารคณะฯ ดังนี้ (ถ้ามี)
          </label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="note3"
            checked={notes.note3}
            onCheckedChange={(checked) =>
              setNotes((prev) => ({
                ...prev,
                note3: checked as boolean,
              }))
            }
          />
          <label htmlFor="note3" className="text-sm leading-relaxed">
            ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการการเงิน ดังนี้ (ถ้ามี)
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
