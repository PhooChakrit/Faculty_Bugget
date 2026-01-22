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
import { Check, Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FormData, Collaborator } from "../../types";
import { Separator } from "@/components/ui/separator";

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
            ชื่อโครงการ (ภาษาไทย) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectNameThai"
            name="projectNameThai"
            value={formData.projectNameThai}
            onChange={handleChange}
            placeholder="ชื่อโครงการภาษาไทย"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectNameEng">
            ชื่อโครงการภาษาอังกฤษ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectNameEng"
            name="projectNameEng"
            value={formData.projectNameEng}
            onChange={handleChange}
            placeholder="ชื่อโครงการภาษาอังกฤษ"
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
              placeholder="ตำแหน่งหน้าที่"
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
            placeholder="email@example.com"
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
        {collaborators.map((collab, index) => (
          <div key={collab.id} className="flex items-center gap-3">
            <span className="text-muted-foreground w-6">{index + 1}.</span>
            <Input
              placeholder="ชื่อหน่วยงาน"
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
              variant="destructive"
              size="icon"
              onClick={() => removeCollaborator(collab.id)}
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCollaborator}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">
              วันที่เริ่มต้น <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              value={
                formData.startDate ? new Date(formData.startDate) : undefined
              }
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  startDate: date ? date.toISOString().split("T")[0] : "",
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">
              วันที่สิ้นสุด <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              value={formData.endDate ? new Date(formData.endDate) : undefined}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  endDate: date ? date.toISOString().split("T")[0] : "",
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
            placeholder="อธิบายความเป็นมาและเหตุผลของโครงการ"
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
            placeholder="ระบุวัตถุประสงค์ของโครงการ"
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
            placeholder="ระบุขอบเขตการดำเนินการ"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="implementationPlan">แผนการดำเนินการ</Label>
          <Textarea
            id="implementationPlan"
            name="implementationPlan"
            value={formData.implementationPlan}
            onChange={handleChange}
            placeholder="ระบุแผนการดำเนินการ"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectDetails">รายละเอียดโครงการ</Label>
          <p className="text-sm text-muted-foreground">ไม่เกิน 200 ตัวอักษร</p>
          <Textarea
            id="projectDetails"
            name="projectDetails"
            value={formData.projectDetails}
            onChange={handleChange}
            placeholder="รายละเอียดโครงการโดยย่อ"
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
