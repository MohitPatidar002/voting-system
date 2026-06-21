"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../../lib/clientApi";
import { useTranslation } from "../../../hooks/useTranslation";
import { Loader2, ClipboardList, FileCheck2 } from "lucide-react";

interface Application {
  id: string;
  schemeName: string;
  status: string;
  reviewerNote: string;
  documentCount: number;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-600",
  under_review: "bg-orange-500/10 text-orange-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
  forwarded: "bg-violet-500/10 text-violet-600",
};

export default function MyApplicationsPage() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/applications");
        const data = await res.json();
        if (res.ok) setApps(data.applications || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusLabel = (s: string) => {
    const map: Record<string, Parameters<typeof t>[0]> = {
      submitted: "statusSubmitted",
      under_review: "statusUnderReview",
      approved: "statusApproved",
      rejected: "statusRejected",
      forwarded: "statusForwarded",
    };
    return map[s] ? t(map[s]) : s;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <ClipboardList className="h-6 w-6" /> {t("myApplications")}
        </h1>
        <p className="text-muted-foreground">{t("myApplicationsDesc")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : apps.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">{t("noApplications")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold">{a.schemeName}</h3>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[a.status] || "bg-muted text-muted-foreground"}`}>
                  {statusLabel(a.status)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="inline-flex items-center gap-1"><FileCheck2 className="h-3.5 w-3.5" />{a.documentCount} {t("documents")}</span>
                <span>{new Date(a.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
              {a.reviewerNote && (
                <div className="mt-3 bg-muted/50 p-3 rounded-xl text-sm">
                  <span className="text-xs font-bold text-primary block mb-1">{t("reviewerNote")}</span>
                  {a.reviewerNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
