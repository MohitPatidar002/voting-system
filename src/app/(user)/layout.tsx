"use client";

import { UserGuard } from "../../components/UserGuard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Vote, Bell, User as UserIcon } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { Navbar } from "../../components/Navbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { name: t("dashboard"), href: "/dashboard", icon: Home },
    { name: t("polls"), href: "/polls", icon: Vote },
    { name: t("notices"), href: "/notices", icon: Bell },
    { name: t("profile"), href: "/profile", icon: UserIcon },
  ];

  return (
    <UserGuard>
      <div className="flex flex-col min-h-screen bg-muted/20 pb-16 md:pb-0">
        {/* Top Navbar */}
        <Navbar />

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
              </Link>
            );
          })}
        </nav>
      </div>
    </UserGuard>
  );
}
