"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { StatusCode } from "@/app/generated/prisma/client";

interface StatusHistoryRecord {
  id: string;
  statusCode: StatusCode;
  label: string;
  color: string;
  enteredAt: string;
  exitedAt: string | null;
  duration: number | null; // in days
  enteredBy: {
    id: string;
    name: string;
    email: string;
  };
  branchChoice?: string;
  actionLogs?: Array<{
    id: string;
    actionType: string;
    actorRole: string;
    note: string | null;
    createdAt: string;
    actorUser: { id: string; name: string | null; email: string };
  }>;
  notifications?: Array<{
    type: string;
    isRequired: boolean;
    isCompleted: boolean;
    completedAt: string | null;
    completedBy: { id: string; name: string } | null;
  }>;
}

interface StatusHistoryProps {
  projectId: string;
  maxItems?: number;
  showAll?: boolean;
}

export function StatusHistory({
  projectId,
  maxItems = 5,
  showAll = false,
}: StatusHistoryProps) {
  const [history, setHistory] = useState<StatusHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(showAll);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/projects/${projectId}/status/history`,
        );

        if (!response.ok) {
          throw new Error("ไม่สามารถดึงประวัติสถานะได้");
        }

        const data = await response.json();
        setHistory(data.history || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            <span>กำลังโหลด...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการเปลี่ยนแปลงสถานะ</CardTitle>
          <CardDescription>ยังไม่มีประวัติการเปลี่ยนแปลงสถานะ</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const displayedHistory = expanded ? history : history.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ประวัติการเปลี่ยนแปลงสถานะ</CardTitle>
        <CardDescription>
          แสดง {displayedHistory.length} จาก {history.length} รายการ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline */}
          <div className="space-y-6">
            {displayedHistory.map((record, index) => {
              const isFirst = index === 0;
              const isLast = index === displayedHistory.length - 1;

              return (
                <div key={record.id} className="relative flex gap-4">
                  {/* Timeline Line */}
                  {!isLast && (
                    <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  {/* Timeline Dot */}
                  <div className="flex-shrink-0 mt-1">
                    {isFirst ? (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                      </div>
                    ) : record.exitedAt ? (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-gray-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={record.color}>
                        {record.statusCode}
                      </Badge>
                      <span className="font-medium">{record.label}</span>
                      {isFirst && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-300"
                        >
                          สถานะปัจจุบัน
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        เข้าสู่สถานะ:{" "}
                        {new Date(record.enteredAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                      {record.exitedAt && (
                        <div>
                          ออกจากสถานะ:{" "}
                          {new Date(record.exitedAt).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      )}
                      {record.duration !== null && (
                        <div className="text-gray-500">
                          ระยะเวลา: {record.duration} วัน
                        </div>
                      )}
                      <div>โดย: {record.enteredBy.name}</div>
                      {record.branchChoice && (
                        <div className="text-gray-500">
                          หมายเหตุ: {record.branchChoice}
                        </div>
                      )}
                      {record.actionLogs && record.actionLogs.length > 0 && (
                        <div className="mt-2 space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
                          {record.actionLogs.map((log) => (
                            <div
                              key={log.id}
                              className="text-xs text-slate-600"
                            >
                              <span className="font-medium">
                                {log.actionType}
                              </span>
                              {log.note ? `: ${log.note}` : ""} โดย{" "}
                              {log.actorUser.name || log.actorRole} (
                              {log.actorRole}) เมื่อ{" "}
                              {new Date(log.createdAt).toLocaleDateString(
                                "th-TH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notifications for STATUS_10 */}
                    {record.statusCode === "STATUS_10" &&
                      record.notifications &&
                      record.notifications.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-sm font-medium mb-2">
                            การแจ้งหน่วยงาน:
                          </div>
                          <div className="space-y-1 text-sm">
                            {record.notifications.map((notif, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                {notif.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-400" />
                                )}
                                <span
                                  className={
                                    notif.isCompleted
                                      ? "text-green-700"
                                      : "text-gray-600"
                                  }
                                >
                                  {notif.type}
                                  {notif.isRequired && " (บังคับ)"}
                                  {notif.completedAt && notif.completedBy && (
                                    <span className="text-gray-500 ml-2">
                                      -{" "}
                                      {new Date(
                                        notif.completedAt,
                                      ).toLocaleDateString("th-TH", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      โดย {notif.completedBy.name}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More Button */}
          {!expanded && history.length > maxItems && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              แสดงทั้งหมด ({history.length - maxItems} รายการเพิ่มเติม)
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
