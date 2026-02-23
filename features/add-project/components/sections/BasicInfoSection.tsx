import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FormData, Collaborator } from "../../types";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface BasicInfoSectionProps {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  departmentOptions: { value: string; label: string }[];
  collaborators: Collaborator[];
  setCollaborators: React.Dispatch<React.SetStateAction<Collaborator[]>>;
}

export function BasicInfoSection({
  formData,
  handleChange,
  setFormData,
  departmentOptions,
  collaborators,
  setCollaborators,
}: BasicInfoSectionProps) {
  const addCollaborator = () => {
    setCollaborators((prev) => [...prev, { id: Date.now(), name: "" }]);
  };

  const removeCollaborator = (id: number) => {
    if (collaborators.length > 1) {
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectNameThai">
            ชื่อโครงการภาษาไทย <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectNameThai"
            name="projectNameThai"
            value={formData.projectNameThai}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectNameEng">ชื่อโครงการภาษาอังกฤษ</Label>
          <Input
            id="projectNameEng"
            name="projectNameEng"
            value={formData.projectNameEng}
            onChange={handleChange}
          />
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leaderPosition">ตำแหน่ง</Label>
            <Input
              id="leaderPosition"
              name="leaderPosition"
              value={formData.leaderPosition}
              onChange={handleChange}
            />
          </div>
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
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coLeaderName">ชื่อผู้ประสานโครงการ</Label>
          <Input
            id="coLeaderName"
            name="coLeaderName"
            type="text"
            value={formData.coLeaderName}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coLeaderEmail">อีเมลผู้ประสานโครงการ</Label>
          <Input
            id="coLeaderEmail"
            name="coLeaderEmail"
            type="email"
            value={formData.coLeaderEmail}
            onChange={handleChange}
          />
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
              <SelectValue />
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
        <div className="flex justify-between items-center mt-4">
          <Label>ร่วมกับ (ถ้ามี)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCollaborator}
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มผู้ร่วมงาน
          </Button>
        </div>
        {collaborators.map((collab, index) => (
          <div key={collab.id} className="flex items-center gap-3">
            <span className="text-muted-foreground w-6">{index + 1}.</span>
            <Input
              value={collab.name}
              onChange={(e) => {
                const newData = [...collaborators];
                newData[index].name = e.target.value;
                setCollaborators(newData);
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeCollaborator(collab.id)}
              disabled={collaborators.length <= 1}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Separator />

        <div className="space-y-2">
          <Label>
            วันที่จัดโครงการ <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <DatePicker
              className="flex-1 w-full"
              placeholder="เลือกวันที่เริ่มต้น"
              value={
                formData.startDate ? new Date(formData.startDate) : undefined
              }
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  startDate: date ? format(date, "yyyy-MM-dd") : "",
                }))
              }
            />
            <span className="text-sm whitespace-nowrap text-muted-foreground w-full sm:w-auto text-center">
              ถึง
            </span>
            <DatePicker
              className="flex-1 w-full"
              placeholder="เลือกวันที่สิ้นสุด"
              value={formData.endDate ? new Date(formData.endDate) : undefined}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  endDate: date ? format(date, "yyyy-MM-dd") : "",
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background">
            ความเป็นมา หลักการและเหตุผล <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="background"
            name="background"
            value={formData.background}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objectives">
            วัตถุประสงค์ <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="objectives"
            name="objectives"
            value={formData.objectives}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scope">ขอบเขตการดำเนินการ</Label>
          <Textarea
            id="scope"
            name="scope"
            value={formData.scope}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="implementationPlan">ขั้นตอนการดำเนินการ</Label>
          <Textarea
            id="implementationPlan"
            name="implementationPlan"
            value={formData.implementationPlan}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectDetails">
            รายละเอียดโครงการ <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">ไม่เกิน 200 ตัวอักษร</p>
          <Textarea
            id="projectDetails"
            name="projectDetails"
            value={formData.projectDetails}
            onChange={handleChange}
            maxLength={200}
            rows={3}
          />
          <p className="text-sm text-muted-foreground text-right">
            {formData.projectDetails.length}/200 ตัวอักษร
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
