"use client";

import { AdminGuard } from "../../components/AdminGuard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Vote, Bell, LayoutDashboard, LogOut } from "lucide-react";
import { auth } from "../../lib/firebase/config";
import { signOut } from "firebase/auth";
import { useTranslation } from "../../hooks/useTranslation";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { name: t("adminDashboard"), href: "/admin/dashboard", icon: LayoutDashboard },
    { name: t("households"), href: "/admin/households", icon: Users },
    { name: t("polls"), href: "/admin/polls", icon: Vote },
    { name: t("notices"), href: "/admin/notices", icon: Bell },
  ];

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
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
            <h2 className="font-bold text-lg text-primary">Admin Panel</h2>
            <div className="flex gap-2">
              <ThemeToggle />
              <button onClick={handleLogout} className="p-2 text-destructive">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
