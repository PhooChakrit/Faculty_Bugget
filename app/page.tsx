import { Sidebar } from "@/components/Sidebar";
import { FlaskConical } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-[family-name:var(--font-sarabun)]">
      <Sidebar />
      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-100/60 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-slate-200/80 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-50/50 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
          <div className="bg-white shadow-xl border border-indigo-100 p-5 rounded-3xl text-indigo-600 mb-2">
            <FlaskConical size={48} strokeWidth={1.5} />
          </div>

          <p className="text-xs font-semibold text-indigo-400 tracking-[0.3em] uppercase">
            คณะวิทยาศาสตร์ · ระบบบริหารงบประมาณโครงการ
          </p>

          <h1 className="text-6xl font-bold text-slate-800 leading-tight">
            สวัสดี,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
              Dev
            </span>{" "}
            👋
          </h1>

          <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
            เลือกเมนูจากแถบด้านซ้าย
            <br />
            เพื่อเริ่มใช้งานระบบ
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-400">ระบบพร้อมใช้งาน</span>
          </div>
        </div>
      </main>
    </div>
  );
}
