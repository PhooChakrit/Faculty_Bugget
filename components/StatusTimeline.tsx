'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusCode } from '@/app/generated/prisma/client';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

interface AvailableTransition {
  toStatus: StatusCode;
  label: string;
  color: string;
  condition?: string;
}

interface CurrentStatus {
  code: StatusCode;
  label: string;
  color: string;
  enteredAt: string;
  enteredBy: {
    id: string;
    name: string;
    email: string;
  };
  notifications?: Array<{
    type: string;
    isRequired: boolean;
    isCompleted: boolean;
  }>;
}

interface StatusTimelineProps {
  projectId: string;
  userId: string; // Current user making the transition
  onTransitionComplete?: () => void;
}

export function StatusTimeline({ projectId, userId, onTransitionComplete }: StatusTimelineProps) {
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [availableTransitions, setAvailableTransitions] = useState<AvailableTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/status`);
      
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลสถานะได้');
      }

      const data = await response.json();
      setCurrentStatus(data.currentStatus);
      setAvailableTransitions(data.availableTransitions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [projectId]);

  const handleTransition = async (toStatus: StatusCode) => {
    if (!confirm(`ต้องการเปลี่ยนสถานะเป็น "${availableTransitions.find(t => t.toStatus === toStatus)?.label}" หรือไม่?`)) {
      return;
    }

    try {
      setTransitioning(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/status/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถเปลี่ยนสถานะได้');
      }

      // Refresh status
      await fetchStatus();
      
      if (onTransitionComplete) {
        onTransitionComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setTransitioning(false);
    }
  };

  const handleRecall = async () => {
    if (!confirm('ต้องการเรียกคืนเอกสารหรือไม่?')) {
      return;
    }

    try {
      setTransitioning(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถเรียกคืนเอกสารได้');
      }

      await fetchStatus();
      
      if (onTransitionComplete) {
        onTransitionComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setTransitioning(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>สถานะโครงการ</CardTitle>
        <CardDescription>สถานะปัจจุบันและการเปลี่ยนแปลงที่สามารถทำได้</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Status */}
        {currentStatus && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currentStatus.label}</span>
                  <Badge className={currentStatus.color}>
                    {currentStatus.code}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  เข้าสู่สถานะเมื่อ: {new Date(currentStatus.enteredAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  โดย: {currentStatus.enteredBy.name}
                </div>
              </div>
            </div>

            {/* Show notification progress if in STATUS_10 */}
            {currentStatus.code === 'STATUS_10' && currentStatus.notifications && (
              <div className="ml-8 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium mb-2">การแจ้งหน่วยงาน:</div>
                <div className="space-y-1 text-sm">
                  {currentStatus.notifications.map((notif, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {notif.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={notif.isCompleted ? 'text-green-700' : 'text-gray-600'}>
                        {notif.type} {notif.isRequired && '(บังคับ)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Available Transitions */}
        <div className="space-y-3">
          <h4 className="font-medium">การเปลี่ยนแปลงที่สามารถทำได้:</h4>
          
          {availableTransitions.length === 0 ? (
            <p className="text-sm text-gray-500">ไม่มีการเปลี่ยนแปลงที่สามารถทำได้ในขณะนี้</p>
          ) : (
            <div className="grid gap-2">
              {availableTransitions.map((transition) => (
                <Button
                  key={transition.toStatus}
                  onClick={() => handleTransition(transition.toStatus)}
                  disabled={transitioning}
                  variant="outline"
                  className="justify-start h-auto py-3"
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center gap-2">
                      <Badge className={transition.color}>
                        {transition.toStatus}
                      </Badge>
                      <span className="font-medium">{transition.label}</span>
                    </div>
                    {transition.condition && (
                      <span className="text-xs text-gray-500 mt-1">
                        {transition.condition}
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Recall Button (only for STATUS_1) */}
        {currentStatus?.code === 'STATUS_1' && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleRecall}
              disabled={transitioning}
              variant="destructive"
              size="sm"
            >
              เรียกคืนเอกสาร
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
