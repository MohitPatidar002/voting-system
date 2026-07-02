"use client";

import { useTranslation } from "../hooks/useTranslation";
import { Navbar } from "../components/Navbar";
import {
  ArrowRight, Vote, Bell, Users, LayoutDashboard, IndianRupee,
  HardHat, Contact, Landmark, FileText, MessageSquare, ShieldCheck,
  CalendarDays, CheckCircle2, Scale,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

export default function Home() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  // Transparency records are public by design — no login needed to inspect
  // where money goes, what works are running, or what the Gram Sabha decided.
  const publicServices = [
    { href: "/budget", label: t("budget"), desc: t("budgetDesc"), icon: IndianRupee },
    { href: "/development", label: t("development"), desc: t("developmentDesc"), icon: HardHat },
    { href: "/directory", label: t("directory"), desc: t("directoryDesc"), icon: Contact },
    { href: "/meetings", label: t("meetings"), desc: t("meetingsDesc"), icon: Landmark },
  ];

  const citizenServices = [
    { label: t("schemes"), desc: t("schemesDesc"), icon: FileText },
    { label: t("polls"), desc: t("stayUpdated"), icon: Vote },
    { label: t("complaints"), desc: t("complaintBoxDesc"), icon: MessageSquare },
    { label: t("notices"), desc: t("checkNoticesTab"), icon: Bell },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-14 md:py-20 text-center">
            <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 p-4 text-primary">
                <Landmark className="h-10 w-10" />
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                {t("welcomeTitle")}
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
                {t("welcomeDesc")}
              </p>
              <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                {loading ? (
                  <div className="h-12 w-40 animate-pulse rounded-md bg-muted" />
                ) : user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
                  >
                    {t("dashboard")} <LayoutDashboard className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
                  >
                    {t("login")} <ArrowRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>{t("loginHelpText")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Know Your Panchayat — civic awareness. Static bilingual content:
            what the institutions are, why the Gram Sabha matters, and the
            rights villagers can exercise — each wired to the portal feature
            that exercises it. */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                {t("knowPanchayatTitle")}
              </h2>
              <p className="mt-3 text-muted-foreground">{t("knowPanchayatIntro")}</p>
            </div>

            {/* What is the Panchayat / the Gram Sabha */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold">{t("whatIsGpTitle")}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{t("whatIsGpText")}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold">{t("whatIsGsTitle")}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{t("whatIsGsText")}</p>
              </div>
            </div>

            {/* Why the Gram Sabha matters + villager rights */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold">{t("whyGsTitle")}</h3>
                </div>
                <ol className="space-y-3">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <li key={n} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {n}
                      </span>
                      {t(`whyGs${n}`)}
                    </li>
                  ))}
                </ol>
                <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                  {t("gsWhenText")}
                </p>
                <Link
                  href="/meetings"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  {t("ctaMeetings")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Scale className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold">{t("yourRightsTitle")}</h3>
                </div>
                <ul className="space-y-3">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <li key={n} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      {t(`right${n}`)}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/budget"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {t("ctaBudget")} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/complaints"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {t("ctaComplaints")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Public transparency services — open to all, no login */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-xl font-bold tracking-tight md:text-2xl">{t("quickLinks")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {publicServices.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <Icon className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="mb-1 font-bold group-hover:text-primary">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Citizen services — after login */}
        <section className="container mx-auto px-4 pb-14">
          <h2 className="mb-6 text-xl font-bold tracking-tight md:text-2xl">{t("quickActions")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {citizenServices.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <Icon className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="mb-1 font-bold">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Official footer */}
      <footer className="border-t-4 border-primary bg-card">
        <div className="container mx-auto grid gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2 font-bold text-primary">
              <Landmark className="h-5 w-5" /> {t("portalName")}
            </div>
            <p className="text-sm text-muted-foreground">{t("portalDisclaimer")}</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/budget" className="hover:text-primary hover:underline">{t("budget")}</Link></li>
              <li><Link href="/development" className="hover:text-primary hover:underline">{t("development")}</Link></li>
              <li><Link href="/meetings" className="hover:text-primary hover:underline">{t("meetings")}</Link></li>
              <li><Link href="/directory" className="hover:text-primary hover:underline">{t("directory")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("contactOffice")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("portalName")}<br />
              {t("portalSubtitle")}
            </p>
            <Link href="/directory" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <Users className="h-4 w-4" /> {t("directoryDesc")}
            </Link>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {t("portalName")}
        </div>
      </footer>
    </div>
  );
}
