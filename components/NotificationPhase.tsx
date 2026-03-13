"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { NotificationType } from "@/app/generated/prisma/client";

interface NotificationItem {
  type: NotificationType;
  label: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: {
    id: string;
    name: string;
  };
}

interface NotificationPhaseProps {
  projectId: string;
  userId: string;
  onAllRequiredComplete?: () => void;
}

export function NotificationPhase({
  projectId,
  userId,
  onAllRequiredComplete,
}: NotificationPhaseProps) {
  const [checklist, setChecklist] = useState<NotificationItem[]>([]);
  const [canProceed, setCanProceed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/projects/${projectId}/status/notifications`,
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "ไม่สามารถดึงข้อมูลได้");
      }

      const data = await response.json();
      setChecklist(data.checklist || []);
      setCanProceed(data.canProceed || false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChecklist();
  }, [projectId, fetchChecklist]);

  const handleCompleteNotification = async (type: NotificationType) => {
    try {
      setProcessing(type);
      setError(null);

      const response = await fetch(
        `/api/projects/${projectId}/status/notifications/${type.toLowerCase()}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ไม่สามารถบันทึกได้");
      }

      // Refresh checklist
      await fetchChecklist();

      // Notify if all required are complete
      if (data.canProceedToNext && onAllRequiredComplete) {
        onAllRequiredComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setProcessing(null);
    }
  };

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

  if (checklist.length === 0) {
    return null; // Don't show if not in STATUS_10
  }

  const requiredItems = checklist.filter((item) => item.isRequired);
  const optionalItems = checklist.filter((item) => !item.isRequired);

  return (
    <Card>
      <CardHeader>
        <CardTitle>การแจ้งหน่วยงาน (STATUS_10)</CardTitle>
        <CardDescription>
          ทำเครื่องหมายเมื่อแจ้งหน่วยงานต่าง ๆ เรียบร้อยแล้ว
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          {canProceed ? (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              สามารถดำเนินการต่อได้
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              <Clock className="w-4 h-4 mr-1" />
              รอการแจ้งที่บังคับ
            </Badge>
          )}
        </div>

        {/* Required Notifications */}
        <div className="space-y-3">
          <h4 className="font-medium text-red-700">รายการบังคับ</h4>
          <div className="space-y-3">
            {requiredItems.map((item) => (
              <NotificationCheckItem
                key={item.type}
                item={item}
                processing={processing === item.type}
                onComplete={() => handleCompleteNotification(item.type)}
              />
            ))}
          </div>
        </div>

        {/* Optional Notifications */}
        {optionalItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">
              รายการเพิ่มเติม (ถ้ามี)
            </h4>
            <div className="space-y-3">
              {optionalItems.map((item) => (
                <NotificationCheckItem
                  key={item.type}
                  item={item}
                  processing={processing === item.type}
                  onComplete={() => handleCompleteNotification(item.type)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <p className="font-medium mb-1">หมายเหตุ:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              รายการที่มี{" "}
              <span className="text-red-700 font-medium">(บังคับ)</span>{" "}
              จะต้องทำให้เสร็จก่อนจึงจะสามารถเปลี่ยนสถานะต่อได้
            </li>
            <li>รายการเพิ่มเติมสามารถเลือกทำหรือไม่ทำก็ได้</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationCheckItemProps {
  item: NotificationItem;
  processing: boolean;
  onComplete: () => void;
}

function NotificationCheckItem({
  item,
  processing,
  onComplete,
}: NotificationCheckItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50 transition-colors">
      <Checkbox
        checked={item.isCompleted}
        onCheckedChange={() => !item.isCompleted && onComplete()}
        disabled={item.isCompleted || processing}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${item.isCompleted ? "text-green-700" : "text-gray-900"}`}
          >
            {item.label}
          </span>
          {item.isRequired && (
            <Badge variant="destructive" className="text-xs">
              บังคับ
            </Badge>
          )}
          {item.isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
        </div>
        {item.isCompleted && item.completedAt && (
          <div className="text-sm text-gray-500 mt-1">
            แจ้งเมื่อ:{" "}
            {new Date(item.completedAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {item.completedBy && ` โดย ${item.completedBy.name}`}
          </div>
        )}
      </div>
      {processing && <Clock className="w-5 h-5 animate-spin text-gray-400" />}
    </div>
  );
}
