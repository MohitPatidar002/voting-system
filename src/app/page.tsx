"use client";

import { useTranslation } from "../hooks/useTranslation";
import { Navbar } from "../components/Navbar";
import { ArrowRight, Vote, Bell, Users, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

export default function Home() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-4">
            <Vote className="h-12 w-12" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            {t("welcomeTitle")}
          </h1>
          
          <p className="text-xl text-muted-foreground md:text-2xl max-w-2xl mx-auto">
            {t("welcomeDesc")}
          </p>

          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {loading ? (
              <div className="h-12 w-32 bg-muted animate-pulse rounded-md"></div>
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 py-3 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Go to Dashboard <LayoutDashboard className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 py-3 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {t("login")} <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-24 text-left">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <Vote className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">{t("polls")}</h3>
            <p className="text-muted-foreground">
              Participate in secure, verified voting for village development and decisions.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <Bell className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">{t("notices")}</h3>
            <p className="text-muted-foreground">
              Stay updated with the latest announcements and alerts from the Panchayat.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <Users className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">{t("households")}</h3>
            <p className="text-muted-foreground">
              One secure digital identity per household ensuring fair representation.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Gandhawad Village Panchayat. All rights reserved.</p>
      </footer>
    </div>
  );
}
