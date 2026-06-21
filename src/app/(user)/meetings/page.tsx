"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { Loader2, Landmark, CalendarDays, Users, CheckCircle2, ArrowRight } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  date: string;
  status: string;
  agenda: string;
  decisions: string;
  attendanceCount: number;
  nextSteps: string;
}

export default function MeetingsPage() {
  const { t } = useTranslation();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/meetings");
        const data = await res.json();
        if (res.ok) setMeetings(data.meetings || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Landmark className="h-6 w-6" /> {t("meetings")}
        </h1>
        <p className="text-muted-foreground">{t("meetingsDesc")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : meetings.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">{t("noMeetings")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((m) => {
            const completed = m.status === "completed";
            return (
              <div key={m.id} className="bg-card rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-lg">{m.title}</h3>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${completed ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"}`}>
                    {completed ? t("meetingCompleted") : t("meetingScheduled")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {completed && m.attendanceCount > 0 && (
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t("attendance")}: {m.attendanceCount}</span>
                  )}
                </div>

                <Block label={t("agenda")} body={m.agenda} />
                {m.decisions && <Block label={t("decisions")} body={m.decisions} icon />}
                {m.nextSteps && <Block label={t("nextSteps")} body={m.nextSteps} arrow />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Block({ label, body, icon, arrow }: { label: string; body: string; icon?: boolean; arrow?: boolean }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="text-xs font-bold text-primary mb-1 flex items-center gap-1">
        {icon && <CheckCircle2 className="h-3.5 w-3.5" />}
        {arrow && <ArrowRight className="h-3.5 w-3.5" />}
        {label}
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p>
    </div>
  );
}
