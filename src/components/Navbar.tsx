"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationBell } from "./NotificationBell";
import { useTranslation } from "../hooks/useTranslation";
import { Landmark, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { auth } from "../lib/firebase/config";
import { signOut } from "firebase/auth";

export function Navbar() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Official identity strip */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex h-7 items-center justify-between px-4 text-[11px] font-medium tracking-wide">
          <span className="truncate">{t("portalStrip")}</span>
          <span className="hidden sm:block">{t("portalSubtitle")}</span>
        </div>
      </div>
      {/* Tricolour rule */}
      <div className="grid h-1 w-full grid-cols-3">
        <div className="bg-[#FF9933]" />
        <div className="bg-white dark:bg-neutral-200" />
        <div className="bg-[#138808]" />
      </div>

      <div className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <Landmark className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-bold text-base md:text-lg text-foreground">{t("portalName")}</span>
              <span className="hidden truncate text-[11px] text-muted-foreground sm:block">{t("welcomeDesc")}</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <NotificationBell />
            <LanguageToggle />
            <ThemeToggle />
            {!loading && user ? (
              <button
                onClick={() => signOut(auth)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                <LogOut className="h-4 w-4 mr-2 hidden sm:inline" />
                {t("logout")}
              </button>
            ) : !loading ? (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                {t("login")}
              </Link>
            ) : (
              <div className="w-[88px] h-9" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
