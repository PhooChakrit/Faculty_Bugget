"use client";

import { useState, useEffect, useMemo, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/Sidebar";
import {
  Eye,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { getStatusBadge } from "@/lib/status-constants";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// Matches API Response from /api/projects
interface ProjectSummary {
  id: string;
  projectCode: string | null;
  receiptNumber: string | null;
  projectNameThai: string;
  leader: { name: string } | null;
  department: string;
  status: string;
  createdAt: string;
  currentStatusCode: string | null;
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
  const [requestingRevisionId, setRequestingRevisionId] = useState<
    string | null
  >(null);
  const [revisionDialogProjectId, setRevisionDialogProjectId] = useState<
    string | null
  >(null);

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

  const renderStatusBadge = (code: string | null | undefined) => {
    const { label, className } = getStatusBadge(code);
    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium leading-snug ${className}`}
      >
        {label}
      </span>
    );
  };

  const handleRequestRevision = (
    e: MouseEvent<HTMLButtonElement>,
    projectId: string,
  ) => {
    e.stopPropagation();
    setRevisionDialogProjectId(projectId);
  };

  const handleConfirmRevision = async () => {
    if (!revisionDialogProjectId) return;
    const projectId = revisionDialogProjectId;
    setRequestingRevisionId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}/request-revision`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(
          typeof data?.error === "string"
            ? data.error
            : "เกิดข้อผิดพลาดในการส่งคำขอ",
        );
        return;
      }
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, currentStatusCode: "RECALL" } : p,
        ),
      );
      setRevisionDialogProjectId(null);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการส่งคำขอ");
    } finally {
      setRequestingRevisionId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const lowerQuery = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.projectCode?.toLowerCase().includes(lowerQuery) ||
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

  const isProjectEditable = (p: ProjectSummary) =>
    p.currentStatusCode === "DRAFT" || p.currentStatusCode === "STATUS_0";

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
              <table className="w-full table-fixed border-collapse text-left">
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
                      รหัสโครงการ
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
                    <th className="p-3 font-semibold border-r border-slate-700/50 w-[220px] min-w-[220px]">
                      สถานะ
                    </th>
                    <th className="p-3 font-semibold border-r border-slate-700/50 w-[100px] text-center">
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
                            isProjectEditable(project)
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
                        <td className="p-3 align-middle border-r border-slate-100">
                          <div className="font-mono text-sm text-indigo-900 font-semibold">
                            {project.projectCode || "-"}
                          </div>
                          {project.receiptNumber && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              วจบ {project.receiptNumber}
                            </div>
                          )}
                        </td>
                        <td className="p-3 align-middle border-r border-slate-100">
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
                        <td className="p-3 align-middle text-sm text-slate-600 border-r border-slate-100">
                          {project.department || "-"}
                        </td>
                        <td className="p-3 align-middle text-sm text-slate-600 border-r border-slate-100">
                          {project.leader?.name || "-"}
                        </td>
                        <td className="p-3 align-middle border-r border-slate-100">
                          {renderStatusBadge(project.currentStatusCode)}
                        </td>
                        <td className="p-3 align-middle text-center border-r border-slate-100">
                          <div
                            className="flex items-center justify-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {project.currentStatusCode === "STATUS_1" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="ขอแก้ไขเอกสาร"
                                className="h-7 w-7 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-full shrink-0"
                                onClick={(e) =>
                                  handleRequestRevision(e, project.id)
                                }
                                disabled={requestingRevisionId === project.id}
                              >
                                {requestingRevisionId === project.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <RotateCcw size={14} />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-full shrink-0"
                              onClick={() =>
                                router.push(`/projects/${project.id}`)
                              }
                            >
                              <Eye size={16} />
                            </Button>
                          </div>
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

      <ConfirmDialog
        open={revisionDialogProjectId !== null}
        onOpenChange={(open) => !open && setRevisionDialogProjectId(null)}
        title="ขอแก้ไขเอกสาร"
        description="ต้องการส่งคำขอแก้ไขเอกสารใช่หรือไม่?"
        confirmLabel="ส่งคำขอ"
        loading={requestingRevisionId !== null}
        onConfirm={handleConfirmRevision}
      />
    </div>
  );
}
