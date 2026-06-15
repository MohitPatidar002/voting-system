"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { auth } from "../../../lib/firebase/config";
import { Loader2, Vote, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Poll } from "../../../types";

export default function UserPollsList() {
  const { t } = useTranslation();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

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
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Vote className="h-6 w-6 text-primary" />
        All {t("polls")}
      </h1>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : polls.length === 0 ? (
        <div className="p-8 text-center bg-card rounded-2xl border border-border shadow-sm">
          <p className="text-muted-foreground">No polls have been created yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {polls.map(poll => {
            const start = new Date(poll.startDate);
            const end = new Date(poll.endDate);
            const isActive = now >= start && now <= end;
            const isClosed = now > end || poll.status !== 'open';

            return (
              <Link key={poll.id} href={`/polls/${poll.id}`}>
                <div className={`p-5 bg-card hover:bg-muted/50 transition-colors rounded-2xl border ${isActive ? 'border-primary shadow-md' : 'border-border shadow-sm'} group flex flex-col h-full`}>
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {isActive ? "Active" : isClosed ? "Closed" : "Upcoming"}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors flex-1">{poll.title}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto pt-4">
                    {isClosed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <span>{isClosed ? "Voting Closed" : `Ends: ${end.toLocaleDateString()} ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
