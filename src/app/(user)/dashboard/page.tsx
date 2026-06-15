"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { auth } from "../../../lib/firebase/config";
import { Loader2, Vote, Bell, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Poll } from "../../../types";

export default function UserDashboard() {
  const { t } = useTranslation();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch("/api/polls", {
          headers: { "Authorization": `Bearer ${token}` }
        });
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
  const activePolls = polls.filter(p => new Date(p.startDate) <= now && new Date(p.endDate) >= now);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        {userName && (
          <div className="text-xl font-medium text-muted-foreground">
            {t("hello")}, <span className="font-bold text-foreground">{userName}</span>!
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          {t("welcomeTitle")}
        </h1>
        <p className="text-muted-foreground">
          {t("stayUpdated")}
        </p>
      </div>

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
            {activePolls.map(poll => (
              <Link key={poll.id} href={`/polls/${poll.id}`}>
                <div className="p-5 bg-card hover:bg-muted/50 transition-colors rounded-2xl border border-border shadow-sm group">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{poll.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    <span>{t("ends")}: {new Date(poll.endDate).toLocaleString()}</span>
                  </div>
                  {poll.hasVoted ? (
                    <div className="w-full h-10 bg-muted text-muted-foreground rounded-xl flex items-center justify-center font-medium transition-colors border border-border">
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

      {/* Notices Section Quick View */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-500" />
            {t("recentNotices")}
          </h2>
          <Link href="/notices" className="text-sm font-medium text-primary flex items-center hover:underline">
            {t("viewAll")} <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
             <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
             <p className="text-muted-foreground">{t("checkNoticesTab")}</p>
             <Link href="/notices" className="mt-4 px-4 py-2 bg-muted hover:bg-accent rounded-lg text-sm font-medium transition-colors">
                {t("readNotices")}
             </Link>
        </div>
      </div>
    </div>
  );
}
