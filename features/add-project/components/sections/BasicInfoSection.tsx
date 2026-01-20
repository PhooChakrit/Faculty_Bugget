import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormData } from "../../types";

interface BasicInfoSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  departmentOptions: { value: string; label: string }[];
}

export function BasicInfoSection({
  formData,
  handleChange,
  setFormData,
  departmentOptions,
}: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="receiptNumber">เลขที่รับ วจบ</Label>
          <Input
            id="receiptNumber"
            name="receiptNumber"
            value={formData.receiptNumber}
            onChange={handleChange}
            placeholder="กรอกเลขที่รับ วจบ"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectNameThai">
            ชื่อโครงการ (ภาษาไทย) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectNameThai"
            name="projectNameThai"
            value={formData.projectNameThai}
            onChange={handleChange}
            placeholder="ชื่อโครงการภาษาไทย"
            className={formData.projectNameThai === "" ? "border-red-500" : ""}
          />
          {formData.projectNameThai === "" && (
            <p className="text-sm text-red-500">จำเป็นต้องกรอก</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectNameEng">ชื่อโครงการภาษาอังกฤษ (ถ้ามี)</Label>
          <div className="relative">
            <Input
              id="projectNameEng"
              name="projectNameEng"
              value={formData.projectNameEng}
              onChange={handleChange}
              placeholder="ชื่อโครงการภาษาอังกฤษ"
              className={formData.projectNameEng ? "border-green-500" : ""}
            />
            {formData.projectNameEng && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="leaderName">
              ชื่อหัวหน้าโครงการ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="leaderName"
              name="leaderName"
              value={formData.leaderName}
              onChange={handleChange}
              placeholder="ชื่อ นามสกุล"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leaderPosition">ตำแหน่ง</Label>
            <Input
              id="leaderPosition"
              name="leaderPosition"
              value={formData.leaderPosition}
              onChange={handleChange}
              placeholder="ตำแหน่งหน้าที่ (ถ้ามี)"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            หน่วยงาน/ภาควิชาที่รับผิดชอบ <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.department}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, department: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="เลือกหน่วยงาน..." />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="leaderEmail">
            อีเมลหัวหน้าโครงการ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="leaderEmail"
            name="leaderEmail"
            type="email"
            value={formData.leaderEmail}
            onChange={handleChange}
            placeholder="email@example.com"
          />
        </div>
      </CardContent>
    </Card>
  );
}
