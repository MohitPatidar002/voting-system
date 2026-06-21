"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../../../lib/clientApi";
import { Loader2, Landmark, Plus, Save, Trash2 } from "lucide-react";

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

const empty = {
  title: "", date: "", status: "scheduled", agenda: "",
  decisions: "", attendanceCount: "", nextSteps: "",
};

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { status: string; decisions: string; attendanceCount: string; nextSteps: string }>>({});
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    const res = await authFetch("/api/admin/meetings");
    if (res.ok) {
      const data = await res.json();
      setMeetings(data.meetings || []);
      const init: typeof edits = {};
      (data.meetings || []).forEach((m: Meeting) => {
        init[m.id] = { status: m.status, decisions: m.decisions, attendanceCount: String(m.attendanceCount || ""), nextSteps: m.nextSteps };
      });
      setEdits(init);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch("/api/admin/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attendanceCount: Number(form.attendanceCount) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg({ type: "ok", text: "Meeting saved." });
      setForm(empty);
      load();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete meeting "${title}"? This cannot be undone.`)) return;
    await authFetch(`/api/admin/meetings?id=${id}`, { method: "DELETE" });
    load();
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    try {
      const res = await authFetch("/api/admin/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: id, ...edits[id], attendanceCount: Number(edits[id].attendanceCount) || 0 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingId(null);
    }
  };

  const input = "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Landmark className="h-6 w-6 text-primary" /> Gram Sabha Meetings</h1>

      {msg && <div className={`p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>{msg.text}</div>}

      <form onSubmit={submit} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> New / Schedule Meeting</h2>
        <input required placeholder="Title *" className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">Date *<input required type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="scheduled">Scheduled (upcoming)</option>
            <option value="completed">Completed (record)</option>
          </select>
        </div>
        <textarea required placeholder="Agenda *" rows={3} className={`${input} h-auto`} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
        <textarea placeholder="Decisions / Resolutions (after meeting)" rows={3} className={`${input} h-auto`} value={form.decisions} onChange={(e) => setForm({ ...form, decisions: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <input type="number" placeholder="Attendance count" className={input} value={form.attendanceCount} onChange={(e) => setForm({ ...form, attendanceCount: e.target.value })} />
          <input placeholder="Next steps (optional)" className={input} value={form.nextSteps} onChange={(e) => setForm({ ...form, nextSteps: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="px-8 h-11 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Meeting
        </button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : meetings.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">No meetings yet.</div>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="bg-card rounded-xl border border-border shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold truncate">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString("en-IN")}</div>
                </div>
                <button onClick={() => remove(m.id, m.title)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <select value={edits[m.id]?.status} onChange={(e) => setEdits((p) => ({ ...p, [m.id]: { ...p[m.id], status: e.target.value } }))} className={input}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
                <input type="number" placeholder="Attendance" value={edits[m.id]?.attendanceCount} onChange={(e) => setEdits((p) => ({ ...p, [m.id]: { ...p[m.id], attendanceCount: e.target.value } }))} className={input} />
              </div>
              <textarea placeholder="Decisions / Resolutions" rows={2} value={edits[m.id]?.decisions} onChange={(e) => setEdits((p) => ({ ...p, [m.id]: { ...p[m.id], decisions: e.target.value } }))} className={`${input} h-auto`} />
              <input placeholder="Next steps" value={edits[m.id]?.nextSteps} onChange={(e) => setEdits((p) => ({ ...p, [m.id]: { ...p[m.id], nextSteps: e.target.value } }))} className={input} />
              <button onClick={() => saveEdit(m.id)} disabled={savingId === m.id} className="h-10 px-5 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2">
                {savingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Update Record
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
