"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { authFetch } from "../../../lib/clientApi";
import {
  Loader2, Vote, Bell, ArrowRight, Clock, MessageSquare,
  FileText, IndianRupee, HardHat, ClipboardList, Contact, Landmark,
} from "lucide-react";
import Link from "next/link";
import { Poll } from "../../../types";

type Tile = {
  href: string;
  labelKey: Parameters<ReturnType<typeof useTranslation>["t"]>[0];
  icon: typeof Vote;
  className: string;
};

const TILES: Tile[] = [
  { href: "/schemes", labelKey: "schemes", icon: FileText, className: "bg-emerald-500/10 text-emerald-600" },
  { href: "/complaints", labelKey: "complaints", icon: MessageSquare, className: "bg-orange-500/10 text-orange-600" },
  { href: "/polls", labelKey: "polls", icon: Vote, className: "bg-violet-500/10 text-violet-600" },
  { href: "/notices", labelKey: "notices", icon: Bell, className: "bg-yellow-500/10 text-yellow-600" },
  { href: "/budget", labelKey: "budget", icon: IndianRupee, className: "bg-blue-500/10 text-blue-600" },
  { href: "/development", labelKey: "development", icon: HardHat, className: "bg-amber-500/10 text-amber-600" },
  { href: "/applications", labelKey: "myApplications", icon: ClipboardList, className: "bg-teal-500/10 text-teal-600" },
  { href: "/directory", labelKey: "directory", icon: Contact, className: "bg-sky-500/10 text-sky-600" },
  { href: "/meetings", labelKey: "meetings", icon: Landmark, className: "bg-indigo-500/10 text-indigo-600" },
  { href: "/updates", labelKey: "updates", icon: Bell, className: "bg-rose-500/10 text-rose-600" },
];

export default function UserDashboard() {
  const { t } = useTranslation();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await authFetch("/api/polls");
        const data = await res.json();
        if (res.ok) {
          setPolls(data.polls);
          if (data.userName) setUserName(data.userName);
        }
      } catch (err) {
        console.error("Failed to fetch polls", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  const now = new Date();
  const activePolls = polls.filter(
    (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        {userName && (
          <div className="text-lg font-medium text-muted-foreground">
            {t("hello")}, <span className="font-bold text-foreground">{userName}</span>!
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-primary">{t("welcomeTitle")}</h1>
      </div>

      {/* Big icon tiles — the heart of the village-friendly home */}
      <div>
        <h2 className="text-lg font-bold mb-3">{t("quickActions")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="flex flex-col items-center justify-center gap-3 p-5 sm:p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-center min-h-[120px]"
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tile.className}`}>
                  <Icon className="h-7 w-7" />
                </span>
                <span className="font-semibold text-sm sm:text-base leading-tight">{t(tile.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active polls quick view */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            {t("activePolls")}
          </h2>
          <Link href="/polls" className="text-sm font-medium text-primary flex items-center hover:underline">
            {t("viewAll")} <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activePolls.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-border shadow-sm">
            <p className="text-muted-foreground">{t("noActivePolls")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activePolls.map((poll) => (
              <Link key={poll.id} href={`/polls/${poll.id}`}>
                <div className="p-5 bg-card hover:bg-muted/50 transition-colors rounded-2xl border border-border shadow-sm group">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{poll.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    <span>{t("ends")}: {new Date(poll.endDate).toLocaleDateString()}</span>
                  </div>
                  {poll.hasVoted ? (
                    <div className="w-full h-10 bg-muted text-muted-foreground rounded-xl flex items-center justify-center font-medium border border-border">
                      {t("alreadyVotedViewResults")}
                    </div>
                  ) : (
                    <div className="w-full h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {t("voteNow")}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
