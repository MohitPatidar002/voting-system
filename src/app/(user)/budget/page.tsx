"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { Loader2, IndianRupee, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface Entry {
  id: string;
  financialYear: string;
  head: string;
  category: "receipt" | "expenditure";
  amount: number;
  description: string;
  date: string;
}
interface Summary {
  totalReceipts: number;
  totalExpenditure: number;
  balance: number;
  byHead: Record<string, { receipt: number; expenditure: number }>;
  availableYears: string[];
}

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function BudgetPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fy, setFy] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(fy ? `/api/budget?fy=${fy}` : "/api/budget");
        const data = await res.json();
        if (res.ok) {
          setEntries(data.entries || []);
          setSummary(data.summary || null);
          if (!fy && data.summary?.availableYears?.length) setFy(data.summary.availableYears[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [fy]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <IndianRupee className="h-6 w-6" /> {t("budget")}
          </h1>
          <p className="text-muted-foreground">{t("budgetDesc")}</p>
        </div>
        {summary && summary.availableYears.length > 0 && (
          <select
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            className="h-10 rounded-xl bg-background border border-border px-3 text-sm"
          >
            {summary.availableYears.map((y) => (
              <option key={y} value={y}>{t("financialYear")} {y}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !summary || entries.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">{t("noBudget")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCard icon={TrendingUp} label={t("totalReceipts")} value={inr(summary.totalReceipts)} className="text-green-600 bg-green-500/10" />
            <SummaryCard icon={TrendingDown} label={t("totalExpenditure")} value={inr(summary.totalExpenditure)} className="text-red-600 bg-red-500/10" />
            <SummaryCard icon={Wallet} label={t("balance")} value={inr(summary.balance)} className="text-blue-600 bg-blue-500/10" />
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.head}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.description || (e.category === "receipt" ? t("receipts") : t("expenditure"))} · {new Date(e.date).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <div className={`font-bold shrink-0 ${e.category === "receipt" ? "text-green-600" : "text-red-600"}`}>
                  {e.category === "receipt" ? "+" : "−"}{inr(e.amount)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, className }: {
  icon: typeof Wallet; label: string; value: string; className: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${className}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-bold text-lg truncate">{value}</div>
      </div>
    </div>
  );
}
