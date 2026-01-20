import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { Notes } from "@/features/add-project/types";

interface NotesSectionProps {
  notes: Notes;
}

export function NotesSection({ notes }: NotesSectionProps) {
  const noteItems = [
    {
      key: "note1",
      text: "ขออนุมัติงบประมาณโครงการที่ไม่เป็นไปตามอัตราการเบิกจ่ายตามข้อบังคับจุฬาลงกรณ์ฯ ว่าด้วยการให้บริการทางวิชาการ พ.ศ. 2564",
    },
    {
      key: "note2",
      text: "ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการบริหารคณะฯ ดังนี้ (ถ้ามี)",
    },
    {
      key: "note3",
      text: "ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการการเงิน ดังนี้ (ถ้ามี)",
    },
    {
      key: "note4",
      text: "ขออนุมัติถัวเฉลี่ยทุกรายการ",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>หมายเหตุ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {noteItems.map((item) => (
          <div key={item.key} className="flex items-start space-x-3">
            <div className="mt-0.5">
              {notes[item.key as keyof Notes] ? (
                <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded border-2 border-muted-foreground/30" />
              )}
            </div>
            <span className="text-sm leading-relaxed">{item.text}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
