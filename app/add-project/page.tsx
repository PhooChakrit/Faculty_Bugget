"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Minus,
  Check,
  User,
  LogOut,
  Home,
  FileText,
  ClipboardPlus,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Options for dropdowns
const departmentOptions = [
  { value: "sci", label: "ภาควิชาวิทยาศาสตร์" },
  { value: "chem", label: "ภาควิชาเคมี" },
  { value: "bio", label: "ภาควิชาชีววิทยา" },
  { value: "phy", label: "ภาควิชาฟิสิกส์" },
  { value: "math", label: "ภาควิชาคณิตศาสตร์" },
];

const serviceTypeOptions = [
  { value: "1", label: "อภิปราย บรรยาย อบรม ประชุม สัมมนา" },
  { value: "2", label: "ออกแบบ ประดิษฐ์ วางแผน วางระบบ เขียน แปล" },
  { value: "3", label: "CONSULT ทางวิชาการ เทคนิค วิชาชีพ" },
  { value: "4", label: "วิเคราะห์ ทดสอบ ตรวจสอบ" },
  { value: "5", label: "งานบริการทางวิชาการลักษณะอื่น" },
  { value: "6", label: "งานให้บริการทางการแพทย์และสาธารณสุข" },
];

const targetGroupOptions = [
  { value: "1", label: "ประชาคมจุฬาฯ" },
  { value: "2", label: "ชุมชน" },
  { value: "3", label: "หน่วยงานภายนอกภาครัฐ" },
  { value: "4", label: "หน่วยงานภายนอกภาคเอกชน/อุตสาหกรรม" },
];

const strategyOptions = [
  { value: "0", label: "ไม่สอดคล้องกับยุทธศาสตร์ใด ๆ" },
  { value: "1", label: "INTERNATIONAL GROWTH" },
  { value: "2", label: "IMPACTFUL GROWTH" },
  { value: "3", label: "INTERNAL GROWTH" },
  { value: "4", label: "INTEGRATED GROWTH" },
  { value: "5", label: "สอดคล้องกับยุทธศาสตร์ส่วนงาน" },
];

interface Collaborator {
  id: number;
  name: string;
}

interface Manager {
  id: number;
  name: string;
  position: string;
}

// Sidebar Component
function Sidebar() {
  const pathname = usePathname();
  const menuItems = [
    { icon: Home, label: "หน้าหลัก", href: "/" },
    { icon: FileText, label: "ข้อมูลโครงการ", href: "/projects" },
    { icon: ClipboardPlus, label: "เพิ่มโครงการ", href: "/add-project" },
    { icon: BarChart3, label: "ประเมินโครงการ", href: "/evaluate" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-5 border-b border-slate-700 flex items-center gap-3">
        <span className="text-lg">☰</span>
        <span className="font-semibold">คณะวิทยาศาสตร์ จุฬาฯ</span>
      </div>

      <nav className="flex-1 py-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-800 ${
                isActive ? "bg-slate-800 border-l-3 border-blue-500" : ""
              }`}
            >
              <Icon className="w-5 h-5 opacity-80" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm">นางสาวสักษณาวิไล ยงหนู</span>
        </div>
        <button className="flex items-center gap-3 mt-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}

// Multi-Select Component using shadcn styling
function MultiSelectField({
  label,
  options,
  value,
  onChange,
  maxSelections,
  hint,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
  hint?: string;
}) {
  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      if (maxSelections && value.length >= maxSelections) return;
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px] bg-background">
        {value.length === 0 ? (
          <span className="text-muted-foreground">เลือก{label}...</span>
        ) : (
          value.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <Badge key={v} variant="secondary" className="gap-1">
                {opt?.label}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x !== v))}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            );
          })
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <Checkbox
              id={`multi-${opt.value}`}
              checked={value.includes(opt.value)}
              disabled={
                !value.includes(opt.value) &&
                maxSelections !== undefined &&
                value.length >= maxSelections
              }
              onCheckedChange={() => toggleOption(opt.value)}
            />
            <label
              htmlFor={`multi-${opt.value}`}
              className="text-sm cursor-pointer"
            >
              {opt.label}
            </label>
          </div>
        ))}
      </div>
      {maxSelections && (
        <p className="text-xs text-muted-foreground">
          เลือกได้สูงสุด {maxSelections} รายการ ({value.length}/{maxSelections})
        </p>
      )}
    </div>
  );
}

export default function AddProjectPage() {
  const [formData, setFormData] = useState({
    receiptNumber: "",
    projectNameThai: "",
    projectNameEng: "",
    leaderName: "",
    leaderPosition: "",
    department: "",
    leaderEmail: "",
    startDate: "",
    endDate: "",
    background: "",
    projectDetails: "",
    objectives: "",
    scope: "",
    implementationPlan: "",
    serviceType: "",
    targetGroups: [] as string[],
    strategies: [] as string[],
    participantCount: "",
    venue: "",
    committee: "",
    expectedBenefits: "",
    budgetSourceExtGov: "",
    budgetSourceExtPrivate: "",
    budgetSourceExtForeign: "",
    budgetSourceInternal: "",
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 1, name: "" },
  ]);

  const [managers, setManagers] = useState<Manager[]>([
    { id: 1, name: "", position: "" },
  ]);

  const [notes, setNotes] = useState({
    note1: false,
    note2: false,
    note3: false,
    note4: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addCollaborator = () => {
    setCollaborators((prev) => [...prev, { id: Date.now(), name: "" }]);
  };

  const removeCollaborator = (id: number) => {
    if (collaborators.length > 1) {
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const addManager = () => {
    setManagers((prev) => [
      ...prev,
      { id: Date.now(), name: "", position: "" },
    ]);
  };

  const removeManager = (id: number) => {
    if (managers.length > 1) {
      setManagers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", {
      formData,
      collaborators,
      managers,
      notes,
    });
    alert("บันทึกข้อมูลสำเร็จ!");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-8">
            แบบฟอร์มโครงการสโมสรนิสิต
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Info */}
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
                    onChange={handleInputChange}
                    placeholder="กรอกเลขที่รับ วจบ"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectNameThai">
                    ชื่อโครงการ (ภาษาไทย){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="projectNameThai"
                    name="projectNameThai"
                    value={formData.projectNameThai}
                    onChange={handleInputChange}
                    placeholder="ชื่อโครงการภาษาไทย"
                    className={
                      formData.projectNameThai === "" ? "border-red-500" : ""
                    }
                  />
                  {formData.projectNameThai === "" && (
                    <p className="text-sm text-red-500">จำเป็นต้องกรอก</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectNameEng">
                    ชื่อโครงการภาษาอังกฤษ (ถ้ามี)
                  </Label>
                  <div className="relative">
                    <Input
                      id="projectNameEng"
                      name="projectNameEng"
                      value={formData.projectNameEng}
                      onChange={handleInputChange}
                      placeholder="ชื่อโครงการภาษาอังกฤษ"
                      className={
                        formData.projectNameEng ? "border-green-500" : ""
                      }
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
                      onChange={handleInputChange}
                      placeholder="ชื่อ นามสกุล"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaderPosition">ตำแหน่ง</Label>
                    <Input
                      id="leaderPosition"
                      name="leaderPosition"
                      value={formData.leaderPosition}
                      onChange={handleInputChange}
                      placeholder="ตำแหน่งหน้าที่ (ถ้ามี)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    หน่วยงาน/ภาควิชาที่รับผิดชอบ{" "}
                    <span className="text-red-500">*</span>
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
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Collaborators */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>ร่วมกับ (ถ้ามี)</CardTitle>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={addCollaborator}
                >
                  <Plus className="w-4 h-4 mr-1" /> เพิ่มข้อมูล
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {collaborators.map((collab, index) => (
                  <div key={collab.id} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder="ชื่อหน่วยงาน หรือ บุคคลภายนอก"
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
              </CardContent>
            </Card>

            {/* Section 3: Project Managers */}
            <Card>
              <CardHeader>
                <CardTitle>ผู้รับผิดชอบโครงการ</CardTitle>
                <p className="text-sm text-muted-foreground">
                  ตำแหน่งหน้าที่ เช่น นายทะเบียนสโมสรนิสิต, ตัวแทนนิสิตชั้นปีที่
                  4
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {managers.map((manager, index) => (
                  <div
                    key={manager.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <span className="text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder="ชื่อ นามสกุล"
                      value={manager.name}
                      onChange={(e) => {
                        const newData = [...managers];
                        newData[index].name = e.target.value;
                        setManagers(newData);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="ตำแหน่งหน้าที่ (ถ้ามี)"
                      value={manager.position}
                      onChange={(e) => {
                        const newData = [...managers];
                        newData[index].position = e.target.value;
                        setManagers(newData);
                      }}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 whitespace-nowrap">
                        ผู้ลงนาม
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeManager(manager.id)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addManager}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Section 4: Dates & Venue */}
            <Card>
              <CardHeader>
                <CardTitle>ระยะเวลาและสถานที่</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      วันที่เริ่มต้น <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      วันที่สิ้นสุด <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participantCount">
                    ผู้เข้าร่วม (จำนวนคน)
                  </Label>
                  <Input
                    id="participantCount"
                    name="participantCount"
                    type="number"
                    value={formData.participantCount}
                    onChange={handleInputChange}
                    placeholder="ระบุจำนวนคน"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">สถานที่จัดโครงการ/อบรม</Label>
                  <Input
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    placeholder="ระบุสถานที่"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>รายละเอียดโครงการ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="background">
                    ความเป็นมา หลักการและเหตุผล{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="background"
                    name="background"
                    value={formData.background}
                    onChange={handleInputChange}
                    placeholder="อธิบายความเป็นมาและเหตุผลของโครงการ"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDetails">รายละเอียดโครงการ</Label>
                  <p className="text-sm text-muted-foreground">
                    ไม่เกิน 200 ตัวอักษร
                  </p>
                  <Textarea
                    id="projectDetails"
                    name="projectDetails"
                    value={formData.projectDetails}
                    onChange={handleInputChange}
                    placeholder="รายละเอียดโครงการโดยย่อ"
                    maxLength={200}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground text-right">
                    {formData.projectDetails.length}/200 ตัวอักษร
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectives">
                    วัตถุประสงค์ <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="objectives"
                    name="objectives"
                    value={formData.objectives}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    placeholder="ระบุแผนการดำเนินการ"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="committee">
                    คณะกรรมการดำเนินงานโครงการ (ถ้ามี)
                  </Label>
                  <Textarea
                    id="committee"
                    name="committee"
                    value={formData.committee}
                    onChange={handleInputChange}
                    placeholder="ระบุรายชื่อคณะกรรมการ"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedBenefits">
                    ประโยชน์ที่คาดว่าจะได้รับ
                  </Label>
                  <Textarea
                    id="expectedBenefits"
                    name="expectedBenefits"
                    value={formData.expectedBenefits}
                    onChange={handleInputChange}
                    placeholder="ระบุประโยชน์ที่คาดว่าจะได้รับ"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Classifications */}
            <Card>
              <CardHeader>
                <CardTitle>การจำแนกประเภท</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>ประเภทงานบริการวิชาการ</Label>
                  <p className="text-sm text-muted-foreground">
                    สามารถเลือกอย่างใดอย่างหนึ่ง
                  </p>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, serviceType: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกประเภท..." />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <MultiSelectField
                  label="กลุ่มเป้าหมาย"
                  options={targetGroupOptions}
                  value={formData.targetGroups}
                  onChange={(values) =>
                    setFormData((prev) => ({ ...prev, targetGroups: values }))
                  }
                  maxSelections={4}
                  hint="สามารถเลือกได้หลายข้อ (มากสุด 4 ข้อ)"
                />

                <Separator />

                <MultiSelectField
                  label="โครงการสอดคล้องกับยุทธศาสตร์/พันธกิจ"
                  options={strategyOptions}
                  value={formData.strategies}
                  onChange={(values) =>
                    setFormData((prev) => ({ ...prev, strategies: values }))
                  }
                  maxSelections={5}
                  hint="สามารถเลือกได้หลายข้อ (มากสุด 5 ข้อ)"
                />
              </CardContent>
            </Card>

            {/* Section 7: Budget Sources */}
            <Card>
              <CardHeader>
                <CardTitle>แหล่งที่มางบประมาณ</CardTitle>
                <p className="text-sm text-muted-foreground">
                  สามารถกรอกได้มากสุด 4 แหล่งงบประมาณ
                  <br />
                  กรณีงบประมาณจากภายนอกต่างประเทศ ต้องแปลงงบประมาณเป็นเงินบาท
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetSourceExtGov">ภายนอกภาครัฐ</Label>
                    <Input
                      id="budgetSourceExtGov"
                      name="budgetSourceExtGov"
                      type="number"
                      value={formData.budgetSourceExtGov}
                      onChange={handleInputChange}
                      placeholder="จำนวนเงิน (บาท)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetSourceExtPrivate">
                      ภายนอกภาคเอกชน
                    </Label>
                    <Input
                      id="budgetSourceExtPrivate"
                      name="budgetSourceExtPrivate"
                      type="number"
                      value={formData.budgetSourceExtPrivate}
                      onChange={handleInputChange}
                      placeholder="จำนวนเงิน (บาท)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetSourceExtForeign">
                      ภายนอกต่างประเทศ
                    </Label>
                    <Input
                      id="budgetSourceExtForeign"
                      name="budgetSourceExtForeign"
                      type="number"
                      value={formData.budgetSourceExtForeign}
                      onChange={handleInputChange}
                      placeholder="จำนวนเงิน (บาท)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetSourceInternal">
                      รายได้มหาวิทยาลัย
                    </Label>
                    <Input
                      id="budgetSourceInternal"
                      name="budgetSourceInternal"
                      type="number"
                      value={formData.budgetSourceInternal}
                      onChange={handleInputChange}
                      placeholder="จำนวนเงิน (บาท)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 8: Budget Table */}
            <Card>
              <CardHeader>
                <CardTitle>งบประมาณรายรับ-รายจ่าย</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">ประมาณการรายรับ</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">รายละเอียด</th>
                          <th className="text-left p-3 w-48">
                            งบประมาณที่ตั้งไว้ (บาท)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3">เงินสนับสนุน</td>
                          <td className="p-3">
                            <Input type="number" placeholder="0.00" />
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3">ค่าลงทะเบียน</td>
                          <td className="p-3">
                            <Input type="number" placeholder="0.00" />
                          </td>
                        </tr>
                        <tr className="border-t bg-muted font-medium">
                          <td className="p-3">รวมประมาณการรายรับ</td>
                          <td className="p-3">
                            <Input type="number" placeholder="0.00" readOnly />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">ประมาณการรายจ่าย</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">รายละเอียด</th>
                          <th className="text-left p-3 w-48">
                            งบประมาณที่ตั้งไว้ (บาท)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          "หมวดค่าตอบแทน",
                          "หมวดค่าใช้สอย",
                          "หมวดค่าวัสดุ",
                          "หมวดสาธารณูปโภค",
                          "หมวดเงินอุดหนุน",
                          "หมวดเงินสำรอง",
                        ].map((item) => (
                          <tr key={item} className="border-t">
                            <td className="p-3">{item}</td>
                            <td className="p-3">
                              <Input type="number" placeholder="0.00" />
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t bg-muted font-medium">
                          <td className="p-3">รวมประมาณการรายจ่าย</td>
                          <td className="p-3">
                            <Input type="number" placeholder="0.00" readOnly />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 9: Notes */}
            <Card>
              <CardHeader>
                <CardTitle>หมายเหตุ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="note1"
                    checked={notes.note1}
                    onCheckedChange={(checked) =>
                      setNotes((prev) => ({
                        ...prev,
                        note1: checked as boolean,
                      }))
                    }
                  />
                  <label htmlFor="note1" className="text-sm leading-relaxed">
                    ขออนุมัติงบประมาณโครงการที่ไม่เป็นไปตามอัตราการเบิกจ่ายตามข้อบังคับจุฬาลงกรณ์ฯ
                    ว่าด้วยการให้บริการทางวิชาการ พ.ศ. 2564
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="note2"
                    checked={notes.note2}
                    onCheckedChange={(checked) =>
                      setNotes((prev) => ({
                        ...prev,
                        note2: checked as boolean,
                      }))
                    }
                  />
                  <label htmlFor="note2" className="text-sm leading-relaxed">
                    ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการบริหารคณะฯ ดังนี้
                    (ถ้ามี)
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="note3"
                    checked={notes.note3}
                    onCheckedChange={(checked) =>
                      setNotes((prev) => ({
                        ...prev,
                        note3: checked as boolean,
                      }))
                    }
                  />
                  <label htmlFor="note3" className="text-sm leading-relaxed">
                    ขออนุมัติงบประมาณรายจ่ายต่อคณะกรรมการการเงิน ดังนี้ (ถ้ามี)
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="note4"
                    checked={notes.note4}
                    onCheckedChange={(checked) =>
                      setNotes((prev) => ({
                        ...prev,
                        note4: checked as boolean,
                      }))
                    }
                  />
                  <label htmlFor="note4" className="text-sm leading-relaxed">
                    ขออนุมัติถัวเฉลี่ยทุกรายการ
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline">
                ยกเลิก
              </Button>
              <Button type="submit">บันทึกข้อมูล</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
