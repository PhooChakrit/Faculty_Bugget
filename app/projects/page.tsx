"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Eye, FileText, Loader2, Plus } from "lucide-react";

// Matches API Response from /api/projects
interface ProjectSummary {
  id: string;
  receiptNumber: string | null;
  projectNameThai: string;
  leader: { name: string } | null;
  department: string;
  status: string;
  createdAt: string;
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        const json = await response.json();

        if (json.success && json.data.projects) {
          setProjects(json.data.projects);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "ร่าง", className: "bg-slate-100 text-slate-700" },
      PENDING_APPROVAL: {
        label: "รออนุมัติ",
        className: "bg-yellow-100 text-yellow-800",
      },
      APPROVED: {
        label: "อนุมัติแล้ว",
        className: "bg-green-100 text-green-800",
      },
      REJECTED: { label: "ไม่อนุมัติ", className: "bg-red-100 text-red-800" },
      IN_PROGRESS: {
        label: "กำลังดำเนินการ",
        className: "bg-blue-100 text-blue-800",
      },
      COMPLETED: {
        label: "เสร็จสิ้น",
        className: "bg-purple-100 text-purple-800",
      },
      CANCELLED: { label: "ยกเลิก", className: "bg-slate-200 text-slate-500" },
    };

    const config = statusMap[status] || {
      label: status,
      className: "bg-slate-100 text-slate-700",
    };

    return (
      <span
        className={`px-2.5 py-1 text-xs font-medium rounded-full ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                ข้อมูลโครงการ
              </h1>
              <p className="text-xs text-slate-500">
                รายการโครงการบริการวิชาการทั้งหมด
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/add-project")}
              className="h-9 px-5 bg-blue-600 hover:bg-blue-700 transition-all font-medium"
            >
              <Plus className="mr-2" size={16} />
              สร้างโครงการใหม่
            </Button>
          </div>
        </header>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6">
          <Card className="border-none shadow-md overflow-hidden h-full flex flex-col bg-white rounded-xl">
            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 border-b">เลขที่รับ</th>
                    <th className="p-4 border-b">ชื่อโครงการ</th>
                    <th className="p-4 border-b">หน่วยงาน</th>
                    <th className="p-4 border-b">หัวหน้าโครงการ</th>
                    <th className="p-4 border-b">สถานะ</th>
                    <th className="p-4 border-b w-[100px] text-center">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-slate-400"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                          <span>กำลังโหลดข้อมูล...</span>
                        </div>
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-slate-400"
                      >
                        ไม่พบข้อมูลโครงการ
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="group hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 align-top font-mono text-slate-500">
                          {project.receiptNumber || "-"}
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-medium text-slate-900 line-clamp-2">
                            {project.projectNameThai}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            แก้ไขล่าสุด:{" "}
                            {new Date(project.createdAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-top text-slate-600">
                          {project.department || "-"}
                        </td>
                        <td className="p-4 align-top text-slate-600">
                          {project.leader?.name || "-"}
                        </td>
                        <td className="p-4 align-top">
                          {getStatusBadge(project.status)}
                        </td>
                        <td className="p-4 align-top text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-100 rounded-full"
                          >
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
