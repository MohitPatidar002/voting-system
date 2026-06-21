"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationBell } from "./NotificationBell";
import { useTranslation } from "../hooks/useTranslation";
import { Vote, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { auth } from "../lib/firebase/config";
import { signOut } from "firebase/auth";

export function Navbar() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg md:text-xl text-primary">
            <Vote className="h-6 w-6" />
            <span>{t("villageName")}</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
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
    </header>
  );
}
