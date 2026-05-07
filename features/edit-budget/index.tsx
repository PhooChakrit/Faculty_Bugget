"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ArrowLeft, Save, Loader2, Banknote, AlertCircle } from "lucide-react";

interface BudgetData {
  budgetSourceExtGov: string;
  budgetSourceExtPrivate: string;
  budgetSourceExtForeign: string;
  budgetSourceInternal: string;
  expenseRemuneration: string;
  expenseSupplies: string;
  expenseMaterials: string;
  expenseUtilities: string;
  expenseSubsidy: string;
  expenseReserve: string;
}

const BUDGET_FIELD_LABELS: Record<keyof BudgetData, string> = {
  budgetSourceExtGov: "ภายนอกภาครัฐ",
  budgetSourceExtPrivate: "ภายนอกภาคเอกชน",
  budgetSourceExtForeign: "ภายนอกต่างประเทศ",
  budgetSourceInternal: "รายได้มหาวิทยาลัย",
  expenseRemuneration: "หมวดค่าตอบแทน",
  expenseSupplies: "หมวดค่าใช้สอย",
  expenseMaterials: "หมวดค่าวัสดุ",
  expenseUtilities: "หมวดสาธารณูปโภค",
  expenseSubsidy: "หมวดเงินอุดหนุน",
  expenseReserve: "หมวดเงินสำรอง",
};

const BUDGET_SOURCE_FIELDS: (keyof BudgetData)[] = [
  "budgetSourceExtGov",
  "budgetSourceExtPrivate",
  "budgetSourceExtForeign",
  "budgetSourceInternal",
];

const EXPENSE_FIELDS: (keyof BudgetData)[] = [
  "expenseRemuneration",
  "expenseSupplies",
  "expenseMaterials",
  "expenseUtilities",
  "expenseSubsidy",
  "expenseReserve",
];

function decToStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

export default function EditBudgetPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData>({
    budgetSourceExtGov: "",
    budgetSourceExtPrivate: "",
    budgetSourceExtForeign: "",
    budgetSourceInternal: "",
    expenseRemuneration: "",
    expenseSupplies: "",
    expenseMaterials: "",
    expenseUtilities: "",
    expenseSubsidy: "",
    expenseReserve: "",
  });

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();

      if (!json.success || !json.data) {
        setError("ไม่พบข้อมูลโครงการ");
        return;
      }

      const p = json.data;

      if (p.currentStatusCode !== "STATUS_99") {
        setError("โครงการไม่อยู่ในโหมดแก้ไขการเงิน");
        return;
      }

      setProjectName(p.projectNameThai);
      setBudgetData({
        budgetSourceExtGov: decToStr(p.budgetSourceExtGov),
        budgetSourceExtPrivate: decToStr(p.budgetSourceExtPrivate),
        budgetSourceExtForeign: decToStr(p.budgetSourceExtForeign),
        budgetSourceInternal: decToStr(p.budgetSourceInternal),
        expenseRemuneration: decToStr(p.expenseRemuneration),
        expenseSupplies: decToStr(p.expenseSupplies),
        expenseMaterials: decToStr(p.expenseMaterials),
        expenseUtilities: decToStr(p.expenseUtilities),
        expenseSubsidy: decToStr(p.expenseSubsidy),
        expenseReserve: decToStr(p.expenseReserve),
      });
    } catch {
      setError("ไม่สามารถโหลดข้อมูลโครงการได้");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleChange = (field: keyof BudgetData, value: string) => {
    // Allow only numbers and dots
    const cleaned = value.replace(/[^0-9.]/g, "");
    setBudgetData((prev) => ({ ...prev, [field]: cleaned }));
  };

  const calculateTotal = (fields: (keyof BudgetData)[]) => {
    return fields.reduce(
      (sum, field) => sum + (parseFloat(budgetData[field]) || 0),
      0,
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, number | null> = {};
      for (const field of [
        ...BUDGET_SOURCE_FIELDS,
        ...EXPENSE_FIELDS,
      ] as (keyof BudgetData)[]) {
        const val = budgetData[field];
        payload[field] = val ? parseFloat(val) : null;
      }

      const res = await fetch(`/api/projects/${projectId}/save-budget-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "เกิดข้อผิดพลาด");
        return;
      }

      setShowConfirm(false);
      router.push("/projects");
    } catch {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-slate-50 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={() => router.push("/projects")}>
            กลับไปรายการโครงการ
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/projects")}
              className="h-10 w-10 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Banknote className="text-orange-500" size={24} />
                แก้ไขการเงิน
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {projectName} ({projectId})
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
            <AlertCircle
              className="text-orange-500 mt-0.5 shrink-0"
              size={18}
            />
            <div>
              <p className="text-sm font-medium text-orange-800">
                โหมดแก้ไขการเงิน
              </p>
              <p className="text-xs text-orange-600 mt-1">
                คุณสามารถแก้ไขได้เฉพาะข้อมูลงบประมาณเท่านั้น
                การแก้ไขทั้งหมดจะถูกบันทึก log ไว้
              </p>
            </div>
          </div>

          {/* Budget Sources */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-medium text-lg">แหล่งงบประมาณ</h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BUDGET_SOURCE_FIELDS.map((field) => (
                  <div key={field} className="space-y-1.5">
                    <Label
                      htmlFor={field}
                      className="text-sm text-muted-foreground"
                    >
                      {BUDGET_FIELD_LABELS[field]}
                    </Label>
                    <Input
                      id={field}
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={budgetData[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      className="text-right font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">รวมงบประมาณ</span>
                <span className="font-mono font-semibold text-lg">
                  {formatCurrency(calculateTotal(BUDGET_SOURCE_FIELDS))} บาท
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-medium text-lg">ประมาณการรายจ่าย</h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPENSE_FIELDS.map((field) => (
                  <div key={field} className="space-y-1.5">
                    <Label
                      htmlFor={field}
                      className="text-sm text-muted-foreground"
                    >
                      {BUDGET_FIELD_LABELS[field]}
                    </Label>
                    <Input
                      id={field}
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={budgetData[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      className="text-right font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">รวมรายจ่าย</span>
                <span className="font-mono font-semibold text-lg">
                  {formatCurrency(calculateTotal(EXPENSE_FIELDS))} บาท
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => router.push("/projects")}>
              ยกเลิก
            </Button>
            <Button
              className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => setShowConfirm(true)}
            >
              <Save size={16} />
              บันทึกและส่งกลับ
            </Button>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="ยืนยันการบันทึก"
        description="ข้อมูลงบประมาณจะถูกอัปเดตและโครงการจะกลับสู่สถานะเดิม การแก้ไขทั้งหมดจะถูกบันทึก log ไว้"
        confirmLabel="บันทึก"
        loading={saving}
        onConfirm={handleSave}
      />
    </div>
  );
}
