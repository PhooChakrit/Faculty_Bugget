"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  Home,
  FileText,
  ClipboardPlus,
  BarChart3,
} from "lucide-react";

export function Sidebar() {
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
          <span className="text-sm">นายชาคริต ตั้งภาณุพงศ์</span>
        </div>
        <button className="flex items-center gap-3 mt-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
