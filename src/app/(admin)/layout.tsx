"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "../../components/AdminGuard";
import { useAuth } from "../../components/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Vote, Bell, LayoutDashboard, LogOut, ShieldAlert, MessageSquare, FileText, HardHat, IndianRupee, ClipboardList, Menu, X, Contact, Landmark } from "lucide-react";
import { auth } from "../../lib/firebase/config";
import { signOut } from "firebase/auth";
import { useTranslation } from "../../hooks/useTranslation";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { adminRole, loading } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false); // close the drawer on navigation
  }, [pathname]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/stats", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (res.ok) setStats(await res.json());
      } catch (e) {}
    };
    if (!loading && adminRole) fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [loading, adminRole]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const allNavItems = [
    { name: t("adminDashboard"), href: "/admin/dashboard", icon: LayoutDashboard, roles: ['superadmin', 'admin', 'reviewer'] },
    { name: t("moderation"), href: "/admin/moderation", icon: ShieldAlert, roles: ['superadmin'], badge: stats.pendingModeration },
    { name: t("complaints"), href: "/admin/complaints", icon: MessageSquare, roles: ['superadmin', 'reviewer'], badge: stats.openComplaints },
    { name: t("myApplications"), href: "/admin/applications", icon: ClipboardList, roles: ['superadmin', 'reviewer'] },
    { name: t("households"), href: "/admin/households", icon: Users, roles: ['superadmin', 'admin'] },
    { name: t("polls"), href: "/admin/polls", icon: Vote, roles: ['superadmin', 'admin'] },
    { name: t("schemes"), href: "/admin/schemes", icon: FileText, roles: ['superadmin'] },
    { name: t("development"), href: "/admin/projects", icon: HardHat, roles: ['superadmin'] },
    { name: t("budget"), href: "/admin/budget", icon: IndianRupee, roles: ['superadmin'] },
    { name: t("directory"), href: "/admin/directory", icon: Contact, roles: ['superadmin'] },
    { name: t("meetings"), href: "/admin/meetings", icon: Landmark, roles: ['superadmin', 'reviewer'] },
    { name: t("notices"), href: "/admin/notices", icon: Bell, roles: ['superadmin', 'admin', 'reviewer'] },
  ];

  const navItems = allNavItems.filter(item => adminRole && item.roles.includes(adminRole));

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-muted/20">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold text-xl text-primary flex items-center gap-2">
              <Vote className="h-6 w-6" />
              <span>Admin Panel</span>
            </h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                  {item.badge ? (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border flex flex-col gap-2">
            <div className="flex gap-2 mb-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-dvh overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-30">
            <button onClick={() => setMobileOpen(true)} aria-label="Menu" className="p-2 -ml-2 text-foreground">
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="font-bold text-lg text-primary">Admin Panel</h2>
            <div className="flex gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* Mobile Drawer */}
          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
              <aside className="relative w-72 max-w-[80%] bg-card border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-bold text-lg text-primary flex items-center gap-2">
                    <Vote className="h-5 w-5" /> Admin Panel
                  </h2>
                  <button onClick={() => setMobileOpen(false)} aria-label="Close" className="p-1.5 rounded-md hover:bg-muted">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                        {item.badge ? (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-4 border-t border-border flex flex-col gap-2">
                  <div className="flex gap-2"><LanguageToggle /><ThemeToggle /></div>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md w-full">
                    <LogOut className="h-4 w-4" /> {t("logout")}
                  </button>
                </div>
              </aside>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
