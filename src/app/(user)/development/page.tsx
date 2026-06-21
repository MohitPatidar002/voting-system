"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { Loader2, HardHat, IndianRupee } from "lucide-react";

interface Project {
  id: string;
  name: string;
  type: string;
  description: string;
  contractor: string;
  budgetAllocated: number;
  budgetSpent: number;
  fundingSource: string;
  status: string;
  progressPercent: number;
  images: string[];
  expectedCompletion: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  planned: "bg-slate-500/10 text-slate-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  stalled: "bg-red-500/10 text-red-600",
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function DevelopmentPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (res.ok) setProjects(data.projects || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusLabel = (s: string) => {
    const map: Record<string, Parameters<typeof t>[0]> = {
      planned: "statusPlanned",
      in_progress: "statusInProgress",
      completed: "statusCompleted",
      stalled: "statusStalled",
    };
    return map[s] ? t(map[s]) : s;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <HardHat className="h-6 w-6" /> {t("development")}
        </h1>
        <p className="text-muted-foreground">{t("developmentDesc")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">{t("noProjects")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {p.images?.length > 0 && (
                <div className="flex overflow-x-auto gap-2 p-2 bg-muted/30">
                  {p.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="h-28 w-auto rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[p.status] || "bg-muted text-muted-foreground"}`}>
                    {statusLabel(p.status)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-3">{p.type} · {p.fundingSource}</div>
                {p.description && <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{p.description}</p>}

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>{t("progress")}</span><span>{p.progressPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, p.progressPercent)}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/40 rounded-xl p-2.5">
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><IndianRupee className="h-3 w-3" />{t("allocated")}</div>
                    <div className="font-bold">{inr(p.budgetAllocated)}</div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-2.5">
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><IndianRupee className="h-3 w-3" />{t("spent")}</div>
                    <div className="font-bold">{inr(p.budgetSpent)}</div>
                  </div>
                </div>
                {p.contractor && (
                  <div className="text-xs text-muted-foreground mt-3">{t("contractor")}: {p.contractor}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
