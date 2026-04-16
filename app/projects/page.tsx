"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/Sidebar";
import { Eye, FileText, Loader2, Plus, Search, Trash2 } from "lucide-react";

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

  // New State for Search and Delete
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

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

  useEffect(() => {
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

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const lowerQuery = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.projectNameThai?.toLowerCase().includes(lowerQuery) ||
        p.receiptNumber?.toLowerCase().includes(lowerQuery) ||
        p.department?.toLowerCase().includes(lowerQuery),
    );
  }, [projects, searchQuery]);

  const handleDeleteSelected = async () => {
    if (selectedProjects.size === 0) return;

    if (
      !confirm(
        `คุณต้องการลบโครงการที่เลือกจำนวน ${selectedProjects.size} รายการใช่หรือไม่?`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedProjects).map((id) =>
        fetch(`/api/projects/${id}`, { method: "DELETE" }),
      );

      await Promise.all(deletePromises);

      // Remove deleted from state
      setProjects((prev) => prev.filter((p) => !selectedProjects.has(p.id)));
      setSelectedProjects(new Set());
    } catch (error) {
      console.error("Failed to delete projects:", error);
      alert("เกิดข้อผิดพลาดในการลบโครงการ");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-[family-name:var(--font-sarabun)]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
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

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="ค้นหาชื่อโครงการ, รหัส..."
                className="pl-8 h-9 w-[200px] md:w-[250px] bg-slate-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedProjects.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-9 px-4 transition-all"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                ลบ ({selectedProjects.size})
              </Button>
            )}
            <Button
              onClick={() => router.push("/add-project")}
              className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 transition-all font-medium"
            >
              <Plus className="mr-2" size={16} />
              สร้างโครงการใหม่
            </Button>
          </div>
        </header>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-slate-100/50 p-4">
          <Card className="border-none shadow-lg overflow-hidden h-full flex flex-col bg-white rounded-lg">
            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-800 text-slate-200 sticky top-0 z-10 text-xs uppercase tracking-wider shadow-sm">
                  <tr>
                    <th className="p-3 font-semibold border-r border-slate-700/50 w-[50px] text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800 w-4 h-4 cursor-pointer"
                        checked={
                          filteredProjects.length > 0 &&
                          selectedProjects.size === filteredProjects.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects(
                              new Set(filteredProjects.map((p) => p.id)),
                            );
                          } else {
                            setSelectedProjects(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="p-3 font-semibold border-r border-slate-700/50 w-[140px]">
                      รหัส / เลขที่รับ
                    </th>
                    <th className="p-3 font-semibold border-r border-slate-700/50">
                      ชื่อโครงการ
                    </th>
                    <th className="p-3 font-semibold border-r border-slate-700/50 w-[180px]">
                      หน่วยงาน
                    </th>
                    <th className="p-3 font-semibold border-r border-slate-700/50 w-[180px]">
                      หัวหน้าโครงการ
                    </th>
                    <th className="p-3 font-semibold border-r border-slate-700/50 w-[120px]">
                      สถานะ
                    </th>
                    <th className="p-3 font-semibold border-r border-slate-700/50 w-[70px] text-center">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-slate-400"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          <span>กำลังโหลดข้อมูล...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-slate-400"
                      >
                        {searchQuery
                          ? "ไม่พบโครงการที่ค้นหา"
                          : "ไม่พบข้อมูลโครงการ"}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() =>
                          router.push(
                            project.status === "DRAFT"
                              ? `/add-project?id=${project.id}`
                              : `/projects/${project.id}`,
                          )
                        }
                        className={`group cursor-pointer transition-colors ${
                          selectedProjects.has(project.id)
                            ? "bg-indigo-50/50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td
                          className="p-3 align-middle border-r border-slate-100 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            checked={selectedProjects.has(project.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedProjects);
                              if (e.target.checked) {
                                newSelected.add(project.id);
                              } else {
                                newSelected.delete(project.id);
                              }
                              setSelectedProjects(newSelected);
                            }}
                          />
                        </td>
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="font-mono text-sm text-indigo-900 font-semibold">
                            {project.id}
                          </div>
                          {project.receiptNumber && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              วจบ {project.receiptNumber}
                            </div>
                          )}
                        </td>
                        <td className="p-3 align-top border-r border-slate-100">
                          <div className="text-sm font-medium text-slate-700 line-clamp-2">
                            {project.projectNameThai}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase">
                            แก้ไขล่าสุด:{" "}
                            {new Date(project.createdAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </div>
                        </td>
                        <td className="p-3 align-top text-sm text-slate-600 border-r border-slate-100">
                          {project.department || "-"}
                        </td>
                        <td className="p-3 align-top text-sm text-slate-600 border-r border-slate-100">
                          {project.leader?.name || "-"}
                        </td>
                        <td className="p-3 align-top border-r border-slate-100">
                          {getStatusBadge(project.status)}
                        </td>
                        <td className="p-3 align-top text-center border-r border-slate-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-full"
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
