"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  userName?: string;
}

const menuItems = [
  { icon: "🏠", label: "หน้าหลัก", href: "/" },
  { icon: "📋", label: "ข้อมูลโครงการ", href: "/projects" },
  { icon: "➕", label: "เพิ่มโครงการ", href: "/add-project" },
  { icon: "📊", label: "ประเมินโครงการ", href: "/evaluate" },
];

export default function Sidebar({ userName = "ผู้ใช้งาน" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">☰</span>
        <span className="sidebar-logo">คณะวิทยาศาสตร์ จุฬาฯ</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${pathname === item.href ? "active" : ""}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">👤</div>
          <span>{userName}</span>
        </div>
        <div className="sidebar-item" style={{ marginTop: 8 }}>
          <span className="sidebar-icon">🚪</span>
          <span>ออกจากระบบ</span>
        </div>
      </div>
    </aside>
  );
}
