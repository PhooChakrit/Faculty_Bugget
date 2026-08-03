"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

/** role ที่ตั้งค่าอีเมลผู้รับได้ (ตรงกับ CONFIGURABLE_ROLES ใน API) */
const ROLE_FIELDS: { role: string; label: string; hint: string }[] = [
  { role: "DEPT_HEAD", label: "หัวหน้าภาควิชา", hint: "อนุมัติขั้น 0→1" },
  { role: "RESEARCH", label: "เจ้าหน้าที่งานวิจัย", hint: "ตัวขับหลักของ workflow" },
  { role: "RESEARCH_HEAD", label: "หัวหน้าฝ่ายวิจัย", hint: "อนุมัติเสนอกรรมการ 2→3" },
  { role: "PLANNING", label: "งานแผน", hint: "ศูนย์ต้นทุน" },
  { role: "FINANCE", label: "งานคลัง", hint: "รหัสเจ้าหนี้ + ปิดโครงการ" },
  { role: "PHYSICAL", label: "งานกายภาพ", hint: "ยืนยันปิดโครงการ" },
];

type EmailsMap = Record<string, string>;

const emptyEmails = (): EmailsMap =>
  Object.fromEntries(ROLE_FIELDS.map((f) => [f.role, ""]));

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleEmailSettingsDialog({ open, onOpenChange }: Props) {
  const [emails, setEmails] = useState<EmailsMap>(emptyEmails);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // โหลดค่าปัจจุบันทุกครั้งที่เปิด
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSavedAt(null);
    setLoading(true);
    fetch("/api/settings/role-emails")
      .then((res) => res.json())
      .then((data) => {
        setEmails({ ...emptyEmails(), ...(data?.emails ?? {}) });
      })
      .catch(() => setError("โหลดค่าอีเมลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/role-emails", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setEmails({ ...emptyEmails(), ...(data?.emails ?? {}) });
      setSavedAt(Date.now());
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ตั้งค่าอีเมลผู้รับแจ้งเตือนแต่ละฝ่าย</DialogTitle>
          <DialogDescription>
            ระบบจะส่งอีเมลแจ้งเตือนไปยังฝ่ายที่ต้องดำเนินการในแต่ละขั้น
            เว้นว่างไว้ = ใช้ค่า mock เดิม เจ้าของโครงการใช้อีเมลของผู้เสนอโดยอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังโหลด…
          </div>
        ) : (
          <div className="space-y-3 py-1">
            {ROLE_FIELDS.map((f) => (
              <div key={f.role} className="grid grid-cols-3 items-center gap-3">
                <div className="col-span-1">
                  <div className="text-sm font-medium text-slate-800">
                    {f.label}
                  </div>
                  <div className="text-xs text-slate-400">{f.hint}</div>
                </div>
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="name@faculty.ac.th"
                  className="col-span-2 h-9 text-sm"
                  value={emails[f.role] ?? ""}
                  onChange={(e) =>
                    setEmails((prev) => ({ ...prev, [f.role]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {savedAt && !error && (
          <p className="text-sm text-green-600">บันทึกเรียบร้อยแล้ว ✓</p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            ปิด
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
