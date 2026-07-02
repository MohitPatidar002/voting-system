"use client";

import { UserGuard } from "../../components/UserGuard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Vote, Bell, User as UserIcon, FileText } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { Navbar } from "../../components/Navbar";
import { useState, useEffect } from "react";
import { auth } from "../../lib/firebase/config";

// Transparency records (budget, works, meeting minutes, directory) are public
// by design — their APIs need no auth, so the pages must not demand login
// either. Everything else in this segment stays behind UserGuard.
const PUBLIC_PATHS = ["/budget", "/development", "/directory", "/meetings"];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>({});
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

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
    fetchStats();
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: t("dashboard"), href: "/dashboard", icon: Home },
    { name: t("schemes"), href: "/schemes", icon: FileText },
    { name: t("polls"), href: "/polls", icon: Vote, badge: stats.activePolls },
    { name: t("notices"), href: "/notices", icon: Bell },
    { name: t("profile"), href: "/profile", icon: UserIcon },
  ];

  const content = (
      <div className="flex flex-col min-h-screen bg-muted/20 pb-bottom-nav md:pb-0">
        {/* Top Navbar */}
        <Navbar />

        {/* Desktop Navigation */}
        <div className="hidden md:block border-b border-border bg-card">
          <div className="container max-w-5xl mx-auto px-4 md:px-8">
            <nav className="flex space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-primary hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                    {item.badge ? (
                      <span className="absolute top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex justify-around items-center h-16 px-2 safe-area-pb">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
                {item.badge ? (
                  <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
  );

  return isPublicPage ? content : <UserGuard>{content}</UserGuard>;
}
