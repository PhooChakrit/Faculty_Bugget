"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface ReceiptInfoSectionProps {
  projectId?: string;
  projectCode?: string | null;
}

export function ReceiptInfoSection({ projectCode }: ReceiptInfoSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">รหัสโครงการ</Label>
          <div className="text-lg font-medium">{projectCode?.trim() || "-"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
