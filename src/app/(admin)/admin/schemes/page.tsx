"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../../../lib/clientApi";
import { Loader2, FileText, Plus, Power, Sparkles, Trash2 } from "lucide-react";

interface Scheme {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  acceptsInAppApplication: boolean;
  applicationEndDate: string | null;
}

const CATEGORIES = ["housing", "agriculture", "health", "women", "pension", "education", "employment", "utility", "other"];

const empty = {
  name: "", nameHi: "", department: "", category: "housing",
  description: "", benefits: "", eligibility: "", requiredDocuments: "",
  applicationStartDate: "", applicationEndDate: "", externalUrl: "",
  acceptsInAppApplication: true, isActive: true,
};

export default function AdminSchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    const res = await authFetch("/api/admin/schemes");
    if (res.ok) setSchemes((await res.json()).schemes || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch("/api/admin/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          requiredDocuments: form.requiredDocuments.split("\n").map((s) => s.trim()).filter(Boolean),
          applicationEndDate: form.applicationEndDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMsg({ type: "ok", text: "Scheme published." });
      setForm(empty);
      load();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (s: Scheme) => {
    await authFetch("/api/admin/schemes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schemeId: s.id, isActive: !s.isActive }),
    });
    load();
  };

  const remove = async (s: Scheme) => {
    if (!confirm(`Delete scheme "${s.name}"? This cannot be undone.`)) return;
    await authFetch(`/api/admin/schemes?id=${s.id}`, { method: "DELETE" });
    load();
  };

  const seed = async () => {
    setSeeding(true);
    setMsg(null);
    try {
      const res = await authFetch("/api/admin/schemes/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg({ type: "ok", text: `Loaded ${data.added} MP schemes.` });
      load();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSeeding(false);
    }
  };

  const input = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Schemes</h1>
        <button onClick={seed} disabled={seeding} className="inline-flex items-center gap-2 px-4 h-10 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium disabled:opacity-50">
          {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Load MP scheme catalogue
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>{msg.text}</div>
      )}

      <form onSubmit={submit} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Add Scheme</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input required placeholder="Name (English) *" className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="नाम (Hindi)" className={input} value={form.nameHi} onChange={(e) => setForm({ ...form, nameHi: e.target.value })} />
          <input placeholder="Department" className={input} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <textarea required placeholder="Description *" rows={2} className={`${input} h-auto`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <textarea required placeholder="Benefits *" rows={2} className={`${input} h-auto`} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
        <textarea required placeholder="Eligibility *" rows={2} className={`${input} h-auto`} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
        <textarea placeholder="Required documents (one per line)" rows={3} className={`${input} h-auto`} value={form.requiredDocuments} onChange={(e) => setForm({ ...form, requiredDocuments: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">Start date<input type="date" className={input} value={form.applicationStartDate} onChange={(e) => setForm({ ...form, applicationStartDate: e.target.value })} /></label>
          <label className="text-sm">End date (blank = ongoing)<input type="date" className={input} value={form.applicationEndDate} onChange={(e) => setForm({ ...form, applicationEndDate: e.target.value })} /></label>
        </div>
        <input placeholder="Official website URL (optional)" className={input} value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.acceptsInAppApplication} onChange={(e) => setForm({ ...form, acceptsInAppApplication: e.target.checked })} />
          Allow villagers to apply on this app (with document upload)
        </label>
        <button type="submit" disabled={saving} className="px-8 h-10 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Publish Scheme
        </button>
      </form>

      <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : schemes.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No schemes yet. Use “Load MP scheme catalogue”.</div>
        ) : (
          schemes.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.category}{s.acceptsInAppApplication ? " · in-app apply" : ""}</div>
              </div>
              <button onClick={() => toggle(s)} className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold shrink-0 ${s.isActive ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                <Power className="h-3.5 w-3.5" /> {s.isActive ? "Active" : "Hidden"}
              </button>
              <button onClick={() => remove(s)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
