"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Download,
  Trash2,
} from "lucide-react";
import axios from "axios";

interface ReceiptInfoSectionProps {
  projectId?: string;
}

type ImportStatus = "idle" | "selected" | "uploading" | "success" | "error";

interface ExcelFileInfo {
  name: string;
  type: string;
  uploadedAt: string;
}

export function ReceiptInfoSection({ projectId }: ReceiptInfoSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [existingFile, setExistingFile] = useState<ExcelFileInfo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing file info from project data
  const fetchFileInfo = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(`/api/projects/${projectId}`);
      const project = res.data.data;
      if (project?.excelFileName) {
        setExistingFile({
          name: project.excelFileName,
          type: project.excelFileType || "",
          uploadedAt: project.excelUploadedAt || "",
        });
      } else {
        setExistingFile(null);
      }
    } catch {
      // silently ignore
    }
  }, [projectId]);

  useEffect(() => {
    fetchFileInfo();
  }, [fetchFileInfo]);

  const resetState = () => {
    setStatus("idle");
    setSelectedFile(null);
    setResultMessage("");
    setIsDragOver(false);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetState();
  };

  const handleFileSelect = (file: File) => {
    const isValidExt = /\.(xlsx|xls|csv)$/i.test(file.name);

    if (!isValidExt) {
      setStatus("error");
      setResultMessage("กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV เท่านั้น");
      return;
    }

    setSelectedFile(file);
    setStatus("selected");
    setResultMessage("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !projectId) return;

    setStatus("uploading");
    setResultMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post(
        `/api/projects/${projectId}/import-excel`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setStatus("success");
      setResultMessage(response.data.data?.message || "อัปโหลดไฟล์สำเร็จ");

      // Update existing file info
      const fileInfo = response.data.data?.file;
      if (fileInfo) {
        setExistingFile({
          name: fileInfo.name,
          type: fileInfo.type,
          uploadedAt: fileInfo.uploadedAt,
        });
      }

      // Close dialog after short delay
      setTimeout(() => {
        handleDialogChange(false);
      }, 1500);
    } catch (err) {
      setStatus("error");
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setResultMessage(err.response.data.error);
      } else {
        setResultMessage("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
      }
    }
  };

  const handleDownload = () => {
    if (!projectId) return;
    window.open(`/api/projects/${projectId}/import-excel`, "_blank");
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/projects/${projectId}/import-excel`);
      setExistingFile(null);
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label className="text-muted-foreground">รหัสโครงการ</Label>
              <div className="text-lg font-medium">{projectId || "-"}</div>
            </div>

            <div className="flex items-center gap-2">
              {/* Show existing file info */}
              {existingFile && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                    <FileSpreadsheet size={14} />
                    <span className="max-w-[120px] truncate font-medium">
                      {existingFile.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                    onClick={handleDownload}
                    title="ดาวน์โหลดไฟล์"
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={deleting}
                    title="ลบไฟล์"
                  >
                    {deleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              )}

              <Button
                id="import-excel-button"
                variant="outline"
                size="sm"
                className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all"
                onClick={() => setDialogOpen(true)}
              >
                <Upload size={16} />
                {existingFile ? "เปลี่ยนไฟล์" : "นำเข้า Excel"}
              </Button>
            </div>
          </div>

          {/* Show upload date */}
          {existingFile?.uploadedAt && (
            <p className="text-xs text-muted-foreground mt-3">
              อัปโหลดเมื่อ: {formatDate(existingFile.uploadedAt)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Import Excel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={20} />
              อัปโหลดไฟล์ Excel
            </DialogTitle>
            <DialogDescription>
              อัปโหลดไฟล์ Excel (.xlsx, .xls) หรือ CSV เพื่อเก็บไว้ในโครงการนี้
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            {(status === "idle" ||
              status === "selected" ||
              status === "error") && (
              <div
                className={`
                  relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8
                  transition-all duration-200 cursor-pointer
                  ${
                    isDragOver
                      ? "border-emerald-400 bg-emerald-50/80 scale-[1.01]"
                      : status === "selected"
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                  }
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />

                {selectedFile ? (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100">
                      <FileSpreadsheet className="text-emerald-600" size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-800">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground hover:text-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setStatus("idle");
                      }}
                    >
                      <X size={14} />
                      เปลี่ยนไฟล์
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
                      <Upload className="text-slate-400" size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600">
                        ลากไฟล์มาวางที่นี่ หรือ{" "}
                        <span className="font-medium text-emerald-600 underline underline-offset-2">
                          คลิกเลือกไฟล์
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        รองรับ .xlsx, .xls, .csv
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Uploading state */}
            {status === "uploading" && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-8">
                <Loader2 className="text-emerald-600 animate-spin" size={32} />
                <p className="text-sm text-slate-600">กำลังอัปโหลด...</p>
              </div>
            )}

            {/* Success state */}
            {status === "success" && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-6">
                <CheckCircle2 className="text-emerald-600" size={32} />
                <p className="text-sm font-medium text-emerald-800">
                  {resultMessage}
                </p>
              </div>
            )}

            {/* Error message */}
            {status === "error" && resultMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/50 p-3">
                <AlertCircle
                  className="text-red-500 mt-0.5 shrink-0"
                  size={16}
                />
                <p className="text-sm text-red-700">{resultMessage}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {status !== "success" && status !== "uploading" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  disabled={!selectedFile || status === "error"}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleUpload}
                >
                  <Upload size={16} />
                  อัปโหลด
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
