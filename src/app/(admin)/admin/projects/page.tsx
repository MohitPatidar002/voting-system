"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../../../lib/clientApi";
import { auth, storage } from "../../../../lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, HardHat, Plus, Trash2, Save } from "lucide-react";
import { FUNDING_SOURCES, PROJECT_TYPES } from "../../../../lib/gramPanchayatData";

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  progressPercent: number;
  budgetAllocated: number;
  budgetSpent: number;
  contractor?: string;
  fundingSource?: string;
}

const STATUSES = ["planned", "in_progress", "completed", "stalled"];
const empty = {
  name: "", type: PROJECT_TYPES[0], description: "", contractor: "",
  fundingSource: FUNDING_SOURCES[0], budgetAllocated: "", budgetSpent: "",
  startDate: "", expectedCompletion: "", status: "planned", progressPercent: "0",
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Per-project inline edit state
  const [edits, setEdits] = useState<Record<string, { progress: number; status: string; budgetSpent: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const res = await authFetch("/api/admin/projects");
    if (res.ok) {
      const data = await res.json();
      const list: Project[] = data.projects || [];
      setProjects(list);
      const init: typeof edits = {};
      list.forEach((p) => { init[p.id] = { progress: p.progressPercent, status: p.status, budgetSpent: String(p.budgetSpent ?? 0) }; });
      setEdits(init);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const uid = auth.currentUser?.uid;
      const imageUrls: string[] = [];
      for (const file of images) {
        const path = `projects/${uid}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        await uploadBytes(ref(storage, path), file);
        imageUrls.push(await getDownloadURL(ref(storage, path)));
      }
      const res = await authFetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budgetAllocated: Number(form.budgetAllocated) || 0,
          budgetSpent: Number(form.budgetSpent) || 0,
          progressPercent: Number(form.progressPercent) || 0,
          startDate: form.startDate || null,
          expectedCompletion: form.expectedCompletion || null,
          images: imageUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg({ type: "ok", text: "Project published." });
      setForm(empty);
      setImages([]);
      load();
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(false);
    }
  };

  const saveProjectUpdate = async (p: Project) => {
    const e = edits[p.id];
    if (!e) return;
    setSavingId(p.id);
    try {
      const res = await authFetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: p.id, progressPercent: e.progress, status: e.status, budgetSpent: Number(e.budgetSpent) || 0 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await authFetch(`/api/admin/projects?id=${p.id}`, { method: "DELETE" });
    load();
  };

  const inp = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><HardHat className="h-6 w-6 text-primary" /> Development Works</h1>

      {msg && <div className={`p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>{msg.text}</div>}

      <form onSubmit={submit} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Add Work</h2>
        <input required placeholder="Project name *" className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <select className={inp} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{PROJECT_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
          <select className={inp} value={form.fundingSource} onChange={(e) => setForm({ ...form, fundingSource: e.target.value })}>{FUNDING_SOURCES.map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <textarea placeholder="Description" rows={2} className={`${inp} h-auto`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <input placeholder="Contractor" className={inp} value={form.contractor} onChange={(e) => setForm({ ...form, contractor: e.target.value })} />
          <select className={inp} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
          <input type="number" placeholder="Budget allocated (₹)" className={inp} value={form.budgetAllocated} onChange={(e) => setForm({ ...form, budgetAllocated: e.target.value })} />
          <input type="number" placeholder="Budget spent (₹)" className={inp} value={form.budgetSpent} onChange={(e) => setForm({ ...form, budgetSpent: e.target.value })} />
          <label className="text-sm">Start date<input type="date" className={inp} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
          <label className="text-sm">Expected completion<input type="date" className={inp} value={form.expectedCompletion} onChange={(e) => setForm({ ...form, expectedCompletion: e.target.value })} /></label>
          <label className="text-sm">Progress %<input type="number" min={0} max={100} className={inp} value={form.progressPercent} onChange={(e) => setForm({ ...form, progressPercent: e.target.value })} /></label>
        </div>
        <label className="block text-sm">Progress photos
          <input type="file" accept="image/*" multiple className="block mt-1 text-sm" onChange={(e) => setImages(e.target.files ? Array.from(e.target.files).slice(0, 8) : [])} />
        </label>
        <button type="submit" disabled={saving} className="px-8 h-10 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Publish Work
        </button>
      </form>

      <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No works yet.</div>
        ) : (
          projects.map((p) => {
            const e = edits[p.id] ?? { progress: p.progressPercent, status: p.status, budgetSpent: String(p.budgetSpent ?? 0) };
            const isSaving = savingId === p.id;
            return (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.type}{p.contractor ? ` · ${p.contractor}` : ""}</div>
                  </div>
                  <button onClick={() => remove(p)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress slider — controlled */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span><span className="font-bold">{e.progress}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100}
                    value={e.progress}
                    onChange={(ev) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], progress: Number(ev.target.value) } }))}
                    className="w-full h-2 accent-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={e.status}
                    onChange={(ev) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], status: ev.target.value } }))}
                    className="h-9 rounded-md border border-input bg-background text-sm px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {STATUSES.map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <input
                      type="number" placeholder="Spent"
                      value={e.budgetSpent}
                      onChange={(ev) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], budgetSpent: ev.target.value } }))}
                      className="pl-6 h-9 w-full rounded-md border border-input bg-background text-sm px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <button onClick={() => saveProjectUpdate(p)} disabled={isSaving} className="flex items-center gap-1.5 px-4 h-9 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Update
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
