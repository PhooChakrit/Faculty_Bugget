"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Calculator, Layers3, Loader2, Wallet } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";

type DashboardSummary = {
  projectCount: number;
  totalExpense: number;
  averageExpense: number;
  topCategory: {
    key: string;
    label: string;
    total: number;
  } | null;
};

type CategorySummary = {
  key: string;
  label: string;
  total: number;
  percent: number;
};

type DepartmentSummary = {
  department: string;
  projectCount: number;
  totalExpense: number;
};

type FiscalYearSummary = {
  fiscalYear: number;
  projectCount: number;
  totalExpense: number;
};

type ProjectExpenseRow = {
  id: string;
  projectCode: string;
  projectName: string;
  department: string;
  fiscalYear: number;
  statusCode: string | null;
  statusLabel: string;
  totalExpense: number;
};

type FilterOption = {
  value: string;
  label: string;
};

type ExpenseDashboardData = {
  summary: DashboardSummary;
  categories: CategorySummary[];
  departments: DepartmentSummary[];
  fiscalYears: FiscalYearSummary[];
  projects: ProjectExpenseRow[];
  filters: {
    departments: string[];
    fiscalYears: FilterOption[];
    statuses: FilterOption[];
    expenseCategories: FilterOption[];
  };
};

const formatMoney = (value: number) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercent = (value: number) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ExpenseDashboardPage() {
  const [data, setData] = useState<ExpenseDashboardData | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("APPROVED");
  const [fiscalYearFilter, setFiscalYearFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          department: departmentFilter,
          status: statusFilter,
          fiscalYear: fiscalYearFilter,
          category: categoryFilter,
        });
        const response = await fetch(`/api/expense-dashboard?${params}`, {
          signal: controller.signal,
        });
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success) {
          throw new Error(json?.error ?? "ไม่สามารถโหลดข้อมูล Dashboard ได้");
        }
        setData(json.data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, [departmentFilter, fiscalYearFilter, statusFilter, categoryFilter]);

  const maxDepartmentTotal = useMemo(() => {
    if (!data?.departments.length) return 0;
    return Math.max(...data.departments.map((item) => item.totalExpense));
  }, [data?.departments]);

  const maxFiscalYearTotal = useMemo(() => {
    if (!data?.fiscalYears.length) return 0;
    return Math.max(...data.fiscalYears.map((item) => item.totalExpense));
  }, [data?.fiscalYears]);

  const cards = [
    {
      label: "จำนวนโครงการ",
      value: data ? data.summary.projectCount.toLocaleString("th-TH") : "-",
      caption: "โครงการที่อนุมัติแล้วตามตัวกรอง",
      icon: Layers3,
    },
    {
      label: "หมวดรายจ่ายสูงสุด",
      value: data?.summary.topCategory?.label ?? "-",
      caption: data?.summary.topCategory
        ? `${formatMoney(data.summary.topCategory.total)} บาท`
        : "ไม่มีข้อมูล",
      icon: BarChart3,
    },
    {
      label: "เฉลี่ยต่อโครงการ (บาท)",
      value: data ? formatMoney(data.summary.averageExpense) : "-",
      caption: "ยอดรวมรายจ่ายหารจำนวนโครงการ",
      icon: Calculator,
    },
    {
      label: "รวมประมาณการรายจ่าย (บาท)",
      value: data ? formatMoney(data.summary.totalExpense) : "-",
      caption: "รวมจาก 6 หมวดรายจ่าย",
      icon: Wallet,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-[family-name:var(--font-sarabun)]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b px-6 py-4 shadow-sm shrink-0 z-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
                <BarChart3 size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Dashboard ประมาณการรายจ่าย
                </h1>
                <p className="text-xs text-slate-500">
                  สรุปจากโครงการที่อนุมัติแล้ว และใช้ข้อมูลประมาณการรายจ่าย 6
                  หมวด
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">
                ปีงบประมาณ
              </label>
              <select
                value={fiscalYearFilter}
                onChange={(event) => setFiscalYearFilter(event.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50 px-3 text-sm focus:ring-indigo-500"
              >
                <option value="all">ทุกปีงบประมาณ</option>
                {(data?.filters.fiscalYears ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="text-xs font-semibold text-slate-500">
                สถานะโครงการ
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50 px-3 text-sm focus:ring-indigo-500"
              >
                {(data?.filters.statuses ?? [
                  { value: "APPROVED", label: "อนุมัติแล้วทั้งหมด" },
                ]).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="ml-2 text-xs font-semibold text-slate-500">
                ภาควิชา
              </label>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50 px-3 text-sm focus:ring-indigo-500"
              >
                <option value="all">ทุกภาควิชา</option>
                {(data?.filters.departments ?? []).map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>

              <label className="ml-2 text-xs font-semibold text-slate-500">
                หมวดรายจ่าย
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-9 rounded border border-slate-200 bg-slate-50 px-3 text-sm focus:ring-indigo-500"
              >
                <option value="all">ทุกหมวดรายจ่าย</option>
                {(data?.filters.expenseCategories ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading && !data ? (
            <div className="flex h-64 items-center justify-center text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card
                      key={card.label}
                      className="rounded-lg border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">
                            {card.label}
                          </div>
                          <div className="mt-2 text-2xl font-bold text-slate-900">
                            {card.value}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {card.caption}
                          </div>
                        </div>
                        <div className="rounded-md bg-indigo-50 p-2 text-indigo-600">
                          <Icon size={18} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
                <Card className="overflow-hidden rounded-lg border-none bg-white p-0 shadow-sm">
                  <div className="border-b px-4 py-3">
                    <h2 className="font-semibold text-slate-800">
                      สรุปตามหมวดรายจ่าย
                    </h2>
                    <p className="text-xs text-slate-500">
                      จำนวนเงินและสัดส่วนจากยอดรวมทั้งหมด
                    </p>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-xs text-slate-600">
                        <tr>
                          <th className="p-3 text-left">หมวดรายจ่าย</th>
                          <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                          <th className="p-3 text-right">สัดส่วน (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(data?.categories ?? []).map((category) => (
                          <tr key={category.key}>
                            <td className="p-3 font-medium text-slate-700">
                              {category.label}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-700">
                              {formatMoney(category.total)}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-indigo-500"
                                    style={{ width: `${category.percent}%` }}
                                  />
                                </div>
                                <span className="w-14 font-mono text-slate-700">
                                  {formatPercent(category.percent)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="overflow-hidden rounded-lg border-none bg-white p-0 shadow-sm">
                  <div className="border-b px-4 py-3">
                    <h2 className="font-semibold text-slate-800">
                      สรุปตามภาควิชา
                    </h2>
                    <p className="text-xs text-slate-500">
                      เรียงตามยอดประมาณการรายจ่ายรวม
                    </p>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-xs text-slate-600">
                        <tr>
                          <th className="p-3 text-left">ภาควิชา</th>
                          <th className="p-3 text-right">โครงการ</th>
                          <th className="p-3 text-right">ยอดรวม (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(data?.departments ?? []).length === 0 ? (
                          <tr>
                            <td
                              className="p-6 text-center text-slate-400"
                              colSpan={3}
                            >
                              ไม่พบข้อมูลตามตัวกรอง
                            </td>
                          </tr>
                        ) : (
                          (data?.departments ?? []).map((item) => {
                            const width =
                              maxDepartmentTotal > 0
                                ? (item.totalExpense / maxDepartmentTotal) * 100
                                : 0;
                            return (
                              <tr key={item.department}>
                                <td className="p-3">
                                  <div className="font-medium text-slate-700">
                                    {item.department}
                                  </div>
                                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-emerald-500"
                                      style={{ width: `${width}%` }}
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {item.projectCount.toLocaleString("th-TH")}
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {formatMoney(item.totalExpense)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <Card className="overflow-hidden rounded-lg border-none bg-white p-0 shadow-sm">
                <div className="border-b px-4 py-3">
                  <h2 className="font-semibold text-slate-800">
                    สรุปตามปีงบประมาณ
                  </h2>
                  <p className="text-xs text-slate-500">
                    ปีงบประมาณคำนวณจากวันที่เริ่มโครงการ โดยนับช่วง ต.ค.-ก.ย.
                  </p>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-xs text-slate-600">
                      <tr>
                        <th className="p-3 text-left">ปีงบประมาณ</th>
                        <th className="p-3 text-right">โครงการ</th>
                        <th className="p-3 text-right">ยอดรวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.fiscalYears ?? []).length === 0 ? (
                        <tr>
                          <td
                            className="p-6 text-center text-slate-400"
                            colSpan={3}
                          >
                            ไม่พบข้อมูลตามตัวกรอง
                          </td>
                        </tr>
                      ) : (
                        (data?.fiscalYears ?? []).map((item) => {
                          const width =
                            maxFiscalYearTotal > 0
                              ? (item.totalExpense / maxFiscalYearTotal) * 100
                              : 0;
                          return (
                            <tr key={item.fiscalYear}>
                              <td className="p-3">
                                <div className="font-medium text-slate-700">
                                  ปีงบประมาณ {item.fiscalYear}
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-sky-500"
                                    style={{ width: `${width}%` }}
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono">
                                {item.projectCount.toLocaleString("th-TH")}
                              </td>
                              <td className="p-3 text-right font-mono">
                                {formatMoney(item.totalExpense)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="overflow-hidden rounded-lg border-none bg-white p-0 shadow-sm">
                <div className="border-b px-4 py-3">
                  <h2 className="font-semibold text-slate-800">
                    รายการโครงการ
                  </h2>
                  <p className="text-xs text-slate-500">
                    คลิกชื่อโครงการเพื่อเปิดหน้ารายละเอียด
                  </p>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-xs text-slate-100">
                      <tr>
                        <th className="min-w-[120px] p-3 text-left">
                          รหัสโครงการ
                        </th>
                        <th className="min-w-[260px] p-3 text-left">
                          ชื่อโครงการ
                        </th>
                        <th className="min-w-[150px] p-3 text-left">
                          ภาควิชา
                        </th>
                        <th className="min-w-[130px] p-3 text-left">
                          ปีงบประมาณ
                        </th>
                        <th className="min-w-[180px] p-3 text-left">
                          สถานะ
                        </th>
                        <th className="min-w-[150px] p-3 text-right">
                          รวมประมาณการรายจ่าย (บาท)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.projects ?? []).length === 0 ? (
                        <tr>
                          <td
                            className="p-8 text-center text-slate-400"
                            colSpan={6}
                          >
                            ไม่พบข้อมูลโครงการตามตัวกรอง
                          </td>
                        </tr>
                      ) : (
                        (data?.projects ?? []).map((project) => (
                          <tr key={project.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-700">
                              {project.projectCode || "-"}
                            </td>
                            <td className="p-3">
                              <Link
                                href={`/projects/${project.id}`}
                                className="font-medium text-indigo-700 hover:text-indigo-500 hover:underline"
                              >
                                {project.projectName}
                              </Link>
                            </td>
                            <td className="p-3 text-slate-600">
                              {project.department}
                            </td>
                            <td className="p-3 text-slate-600">
                              {project.fiscalYear}
                            </td>
                            <td className="p-3">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                {project.statusLabel}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-800">
                              {formatMoney(project.totalExpense)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
