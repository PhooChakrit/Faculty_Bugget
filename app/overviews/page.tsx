"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
/**
 * RBAC CONFIGURATION
 */
type UserRole = "ภาควิชา" | "งานวิจัย" | "งานแผน" | "งานคลัง" | "กายภาพ";

const EDIT_PERMISSIONS: Record<string, UserRole> = {
  boardMeetingNo: "งานวิจัย",
  boardMeetingDate: "งานวิจัย",
  deanDecisionNo: "งานวิจัย",
  deanDecisionDate: "งานวิจัย",
  vendorCode: "งานคลัง",
  costCenter: "งานแผน",
  maintenanceFee: "กายภาพ",
  electricityFee: "กายภาพ",
};

const ROLE_COLORS: Record<UserRole, string> = {
  งานวิจัย: "bg-blue-100 border-blue-300 text-blue-700",
  งานคลัง: "bg-amber-100 border-amber-300 text-amber-700",
  งานแผน: "bg-green-100 border-green-300 text-green-700",
  กายภาพ: "bg-purple-100 border-purple-300 text-purple-700",
  ภาควิชา: "bg-slate-100 border-slate-300 text-slate-700",
};

interface ProjectData {
  id: string;
  receiptNumber: string;
  projectCode: string;
  boardMeetingNo: string;
  boardMeetingDate: string;
  deanDecisionNo: string;
  deanDecisionDate: string;
  purpose: string;
  memoTitle: string;
  department: string;
  projectHead: string;
  totalBudget: string;
  compensation: string;
  operatingCost: string;
  materialCost: string;
  utilities: string;
  academicFund: string;
  generalReserve: string;
  amountGovExternal: string;
  amountPrivateExternal: string;
  amountForeignExternal: string;
  amountUnivRevenue: string;
  startDate: string;
  endDate: string;
  fundOwner: string;
  vendorCode: string;
  costCenter: string;
  maintenanceFee: string;
  electricityFee: string;
  serviceType: string;
  strategyType: string;
  targetGroup: string;
  participantCount: string;
  projectDescription: string;
  status1: string; status1Date: string;
  status2: string; status2Date: string;
  status3: string; status3Date: string;
  status4: string; status4Date: string;
  status5: string; status5Date: string;
  responsible: string;
  docNumber: string;
  docDate: string;
  docLink: string;
}

export default function ComprehensiveProjectPage() {
  const [userRole, setUserRole] = useState<UserRole>("งานแผน");
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
const [projects, setProjects] = useState<ProjectData[]>([]);

useEffect(() => {
    const loadMockData = async () => {
        const response = await fetch('/mock.json');
        const data = await response.json();
        setProjects(data);
    };
    loadMockData();
}, []);

  const handleUpdate = (id: string, field: keyof ProjectData, value: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.projectCode.toLowerCase().includes(query) ||
      project.memoTitle.toLowerCase().includes(query) ||
      project.department.toLowerCase().includes(query) ||
      project.projectHead.toLowerCase().includes(query)
    );
  });

  const DataCell = ({ project, field, label, isNumeric = false }: { project: ProjectData, field: keyof ProjectData, label?: string, isNumeric?: boolean }) => {
    const canEdit = EDIT_PERMISSIONS[field] === userRole;
    const isEditing = editingCell?.id === project.id && editingCell?.field === field;
    const value = project[field];
    const ownerRole = EDIT_PERMISSIONS[field];

    return (
      <div 
        onClick={() => canEdit && setEditingCell({ id: project.id, field })}
        className={`flex flex-col px-3 py-2 min-h-[48px] justify-center transition-all ${canEdit ? "cursor-pointer hover:bg-blue-50 hover:shadow-sm group" : "hover:bg-slate-50/50"}`}
      >
        {label && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase text-slate-500 font-semibold tracking-wide">{label}</span>
            {ownerRole && (
              <Badge variant="outline" className={`text-[7px] h-4 px-1 ${canEdit ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                {ownerRole}
              </Badge>
            )}
          </div>
        )}
        {isEditing ? (
          <Input 
            autoFocus 
            className="h-7 text-xs px-2 border-blue-400 focus:ring-2 focus:ring-blue-200" 
            value={value} 
            onBlur={() => setEditingCell(null)}
            onChange={(e) => handleUpdate(project.id, field, e.target.value)}
          />
        ) : (
          <div className="flex items-center justify-between">
            <span className={`text-xs ${!value ? "text-slate-400 italic" : "text-slate-700"} ${canEdit ? "text-blue-700 font-semibold" : ""} ${isNumeric ? "font-mono" : ""}`}>
              {value || "ไม่มีข้อมูล"}
            </span>
            {canEdit && <span className="text-xs opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">✎</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <header>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">ระบบติดตามโครงการบริการวิชาการ</h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`${ROLE_COLORS[userRole]} border-2 px-3 py-1`}>
                <span className="text-xs font-semibold">บทบาท: {userRole}</span>
              </Badge>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500">{filteredProjects.length} โครงการ</span>
            </div>
          </header>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-md">
            + เพิ่มโครงการ
          </Button>
        </div>

        {/* Search & Role Switcher */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Input 
              placeholder="ค้นหา: รหัสโครงการ, ชื่อโครงการ, หน่วยงาน..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            {(["ภาควิชา", "งานวิจัย", "งานแผน", "งานคลัง", "กายภาพ"] as UserRole[]).map((role) => (
              <Button
                key={role}
                variant={userRole === role ? "default" : "outline"}
                size="sm"
                onClick={() => setUserRole(role)}
                className="text-xs"
              >
                {role}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Table */}
        <Card className="flex-1 overflow-hidden border-slate-200 shadow-2xl rounded-lg bg-white">
          <div className="overflow-auto h-full">
            <table className="w-full border-collapse table-fixed min-w-[2000px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider shadow-md">
                  <th className="w-72 p-4 text-left font-bold">📋 ข้อมูลพื้นฐาน</th>
                  <th className="w-64 p-4 text-left border-l border-slate-600 font-bold">📅 มติที่ประชุม</th>
                  <th className="w-80 p-4 text-left border-l border-slate-600 font-bold">💰 งบประมาณ</th>
                  <th className="w-72 p-4 text-left border-l border-slate-600 font-bold">🎯 แหล่งทุน</th>
                  <th className="w-56 p-4 text-left border-l border-slate-600 font-bold">🔐 ข้อมูลตามสิทธิ์</th>
                  <th className="w-80 p-4 text-left border-l border-slate-600 font-bold">📊 สถานะ</th>
                  <th className="w-56 p-4 text-left border-l border-slate-600 font-bold">📄 เอกสาร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="align-top hover:bg-blue-50/20 transition-colors group">
                    <td className="p-4 bg-slate-50/50">
                      <div className="space-y-3">
                        <Badge className="text-[9px] bg-blue-600 text-white">{project.projectCode}</Badge>
                        <div className="text-xs font-semibold text-slate-800 leading-snug">{project.memoTitle}</div>
                        <div className="space-y-1 pt-2 border-t border-slate-200 text-[10px] text-slate-600">
                          <div><span className="font-semibold">เลขรับ:</span> {project.receiptNumber}</div>
                          <div><span className="font-semibold">หน่วยงาน:</span> {project.department}</div>
                          <div><span className="font-semibold">หัวหน้า:</span> {project.projectHead}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-0 border-l border-slate-200 divide-y divide-slate-100">
                      <div className="bg-blue-50/30"><DataCell project={project} field="boardMeetingNo" label="ประชุมบอร์ด ครั้งที่" /></div>
                      <div className="bg-blue-50/30"><DataCell project={project} field="boardMeetingDate" label="วันที่ประชุมบอร์ด" /></div>
                      <div><DataCell project={project} field="deanDecisionNo" label="มติคณบดี ครั้งที่" /></div>
                      <div><DataCell project={project} field="deanDecisionDate" label="วันที่มติคณบดี" /></div>
                    </td>

                    <td className="p-3 border-l border-slate-200 bg-green-50/20">
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded border border-green-200 flex justify-between">
                          <span className="text-[10px] font-bold">งบรวม:</span>
                          <span className="text-xs font-mono font-bold text-green-700">{project.totalBudget}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <DataCell project={project} field="compensation" label="ค่าตอบแทน" isNumeric />
                          <DataCell project={project} field="operatingCost" label="ค่าใช้สอย" isNumeric />
                          <DataCell project={project} field="materialCost" label="ค่าวัสดุ" isNumeric />
                          <DataCell project={project} field="utilities" label="สาธารณูปโภค" isNumeric />
                        </div>
                      </div>
                    </td>

                    <td className="p-3 border-l border-slate-200 bg-amber-50/20">
                      <div className="text-[10px] text-slate-700 bg-white/80 p-2 rounded border border-amber-100 mb-2">
                        {project.projectDescription}
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex justify-between text-[10px] border-b pb-1"><span>ภาครัฐ:</span> <span>{project.amountGovExternal || "0.00"}</span></div>
                        <div className="flex justify-between text-[10px]"><span>รายได้ ม.:</span> <span>{project.amountUnivRevenue || "0.00"}</span></div>
                      </div>
                    </td>

                    <td className="p-0 border-l border-slate-200 divide-y divide-slate-100">
                      <div className="bg-amber-50/40"><DataCell project={project} field="vendorCode" label="รหัสเจ้าหนี้" /></div>
                      <div className="bg-green-50/40"><DataCell project={project} field="costCenter" label="ศูนย์ต้นทุน" /></div>
                      <div className="bg-purple-50/40"><DataCell project={project} field="maintenanceFee" label="ค่าบำรุงสถานที่" /></div>
                      <div className="bg-purple-50/40"><DataCell project={project} field="electricityFee" label="ค่าไฟฟ้า" /></div>
                    </td>

                    <td className="p-3 border-l border-slate-200 bg-slate-50/30">
                      <div className="space-y-2">
                        {[1, 2, 3].map((num) => {
                          const statusKey = `status${num}` as keyof ProjectData;
                          const dateKey = `status${num}Date` as keyof ProjectData;
                          if (!project[statusKey]) return null;
                          return (
                            <div key={num} className="border-l-2 border-blue-400 pl-2 bg-white p-1 rounded shadow-sm">
                              <div className="text-[10px] font-bold">{project[statusKey]}</div>
                              <div className="text-[9px] text-slate-500">{project[dateKey]}</div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="p-3 border-l border-slate-200 space-y-2">
                      <DataCell project={project} field="docNumber" label="เลขที่หนังสือ" />
                      <div className="pt-2">
                        {project.docLink ? (
                          <a href={project.docLink} target="_blank" className="text-[10px] text-blue-600 underline">📎 ดูประกาศเอกสาร</a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">ไม่มีลิงก์เอกสาร</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer */}
        <footer className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex gap-4">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> สิทธิ์แก้ไข</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300" /> ดูอย่างเดียว</div>
          </div>
          <span>* คลิกที่ช่องข้อมูลที่เป็นสีน้ำเงินเพื่อทำการแก้ไข</span>
        </footer>
      </main>
    </div>
  );
}