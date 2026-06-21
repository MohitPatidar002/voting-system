"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../../../lib/clientApi";
import { Loader2, IndianRupee, Plus, Trash2 } from "lucide-react";
import { BUDGET_HEADS } from "../../../../lib/gramPanchayatData";

interface Entry {
  id: string;
  financialYear: string;
  head: string;
  category: "receipt" | "expenditure";
  amount: number;
  date: string;
}

function currentFY(): string {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; // FY starts April
  return `${y}-${y + 1}`;
}

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminBudgetPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({
    financialYear: currentFY(), head: BUDGET_HEADS[0], category: "receipt",
    amount: "", description: "", date: "",
  });

  const load = async () => {
    const res = await authFetch("/api/admin/budget");
    if (res.ok) setEntries((await res.json()).entries || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch("/api/admin/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) || 0, date: form.date || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg({ type: "ok", text: "Entry added." });
      setForm({ ...form, amount: "", description: "" });
      load();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await authFetch(`/api/admin/budget?id=${id}`, { method: "DELETE" });
    load();
  };

  const input = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><IndianRupee className="h-6 w-6 text-primary" /> Budget Ledger</h1>

      {msg && <div className={`p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>{msg.text}</div>}

      <form onSubmit={submit} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Add Entry</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input required placeholder="Financial year 2025-2026" className={input} value={form.financialYear} onChange={(e) => setForm({ ...form, financialYear: e.target.value })} />
          <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="receipt">Receipt (money in)</option>
            <option value="expenditure">Expenditure (money out)</option>
          </select>
          <select className={input} value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })}>{BUDGET_HEADS.map((h) => <option key={h}>{h}</option>)}</select>
          <input type="number" required placeholder="Amount (₹)" className={input} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input placeholder="Description (optional)" className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="text-sm">Date<input type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
        </div>
        <button type="submit" disabled={saving} className="px-8 h-10 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add Entry
        </button>
      </form>

      <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No entries yet.</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{e.head}</div>
                <div className="text-xs text-muted-foreground">{e.financialYear} · {new Date(e.date).toLocaleDateString("en-IN")}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`font-bold ${e.category === "receipt" ? "text-green-600" : "text-red-600"}`}>
                  {e.category === "receipt" ? "+" : "−"}{inr(e.amount)}
                </span>
                <button onClick={() => remove(e.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
