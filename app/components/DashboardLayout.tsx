import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

export default function DashboardLayout({
  children,
  userName,
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar userName={userName} />
      <main className="main-content">{children}</main>
    </div>
  );
}
