"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Loader2, Plus, Trash2, CalendarClock, PlayCircle, StopCircle, Eye } from "lucide-react";
import { authFetch } from "../../../../lib/clientApi";
import Link from "next/link";

interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  totalVotes: number;
}

export default function AdminPolls() {
  const { t } = useTranslation();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [fetchingPolls, setFetchingPolls] = useState(true);
  const [adminRole, setAdminRole] = useState<string>("admin");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    allowMultiple: false,
    options: [{ id: "1", text: "Option 1" }, { id: "2", text: "Option 2" }],
  });

  const load = async () => {
    try {
      const [roleRes, pollsRes] = await Promise.all([
        authFetch("/api/admin/me"),
        authFetch("/api/admin/polls"),
      ]);
      if (roleRes.ok) setAdminRole((await roleRes.json()).role);
      if (pollsRes.ok) setPolls((await pollsRes.json()).polls || []);
    } catch {
      /* ignore */
    } finally {
      setFetchingPolls(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateOption = (index: number, text: string) => {
    const opts = [...formData.options];
    opts[index].text = text;
    setFormData({ ...formData, options: opts });
  };
  const addOption = () => {
    if (formData.options.length >= 10) return;
    setFormData({ ...formData, options: [...formData.options, { id: Date.now().toString(), text: `Option ${formData.options.length + 1}` }] });
  };
  const removeOption = (i: number) => {
    if (formData.options.length <= 2) return;
    const opts = [...formData.options];
    opts.splice(i, 1);
    setFormData({ ...formData, options: opts });
  };

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) throw new Error("End must be after start.");
      if ((end.getTime() - start.getTime()) / 60000 < 30) throw new Error("Poll must be open for at least 30 minutes.");
      const res = await authFetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: "multiple_choice", startDate: start.toISOString(), endDate: end.toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create poll");
      setCreateSuccess("Poll created as Draft. Click Publish to open it to villagers.");
      setFormData({ title: "", description: "", startDate: "", endDate: "", allowMultiple: false, options: [{ id: "1", text: "Option 1" }, { id: "2", text: "Option 2" }] });
      load();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (poll: Poll, status: string) => {
    setActionId(poll.id);
    try {
      await authFetch("/api/admin/polls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId: poll.id, status }),
      });
      load();
    } finally {
      setActionId(null);
    }
  };

  const deletePoll = async (poll: Poll) => {
    if (!confirm(`Delete "${poll.title}"? This cannot be undone.`)) return;
    setActionId(poll.id);
    try {
      await authFetch(`/api/admin/polls?id=${poll.id}`, { method: "DELETE" });
      load();
    } finally {
      setActionId(null);
    }
  };

  const inp = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const statusBadge = (poll: Poll) => {
    if (poll.status === "open") return <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs rounded-full font-bold">Live</span>;
    if (poll.status === "closed") return <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded-full font-bold">Closed</span>;
    return <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 text-xs rounded-full font-bold">Draft</span>;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">{t("polls")} Management</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="font-bold flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Create New Poll</h2>
          <p className="text-xs text-muted-foreground mt-1">Polls are saved as Draft first — publish when ready.</p>
        </div>
        <div className="p-5 space-y-4">
          {createError && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{createError}</div>}
          {createSuccess && <div className="p-3 bg-green-500/10 text-green-600 text-sm rounded-lg">{createSuccess}</div>}
          <input required placeholder="Poll title *" className={inp} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} maxLength={100} />
          <textarea required placeholder="Description *" rows={2} className={`${inp} h-auto`} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} maxLength={500} />
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium">Start<input required type="datetime-local" className={inp} value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></label>
            <label className="text-sm font-medium">End<input required type="datetime-local" className={inp} value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></label>
          </div>
          <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
            <p className="text-sm font-medium">Options</p>
            {formData.options.map((opt, i) => (
              <div key={opt.id} className="flex gap-2">
                <input required placeholder={`Option ${i + 1}`} maxLength={50} className={inp} value={opt.text} onChange={(e) => updateOption(i, e.target.value)} />
                <button type="button" onClick={() => removeOption(i)} disabled={formData.options.length <= 2} className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {formData.options.length < 10 && (
              <button type="button" onClick={addOption} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add option</button>
            )}
            <label className="flex items-center gap-2 text-sm pt-1">
              <input type="checkbox" checked={formData.allowMultiple} onChange={(e) => setFormData({ ...formData, allowMultiple: e.target.checked })} />
              Allow multiple selections
            </label>
          </div>
          <button type="submit" disabled={creating} className="px-8 h-10 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2">
            {creating && <Loader2 className="h-4 w-4 animate-spin" />} Save as Draft
          </button>
        </div>
      </form>

      {/* Polls list */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="font-bold">All Polls</h2>
        </div>
        <div className="divide-y divide-border">
          {fetchingPolls ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : polls.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No polls yet.</div>
          ) : (
            polls.map((poll) => {
              const isActing = actionId === poll.id;
              return (
                <div key={poll.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{poll.title}</span>
                      {statusBadge(poll)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(poll.startDate).toLocaleString("en-IN")} → {new Date(poll.endDate).toLocaleString("en-IN")} · {poll.totalVotes || 0} votes
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {poll.status !== "open" && (
                      <button onClick={() => setStatus(poll, "open")} disabled={isActing} title="Publish to villagers" className="flex items-center gap-1 px-3 h-8 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-md text-xs font-bold disabled:opacity-50">
                        {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />} Publish
                      </button>
                    )}
                    {poll.status === "open" && (
                      <button onClick={() => setStatus(poll, "closed")} disabled={isActing} title="Close voting" className="flex items-center gap-1 px-3 h-8 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 rounded-md text-xs font-bold disabled:opacity-50">
                        {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <StopCircle className="h-3.5 w-3.5" />} Close
                      </button>
                    )}
                    {adminRole === "superadmin" && (
                      <Link href={`/admin/polls/${poll.id}`} className="flex items-center gap-1 px-3 h-8 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-bold">
                        <Eye className="h-3.5 w-3.5" /> Votes
                      </Link>
                    )}
                    <button onClick={() => deletePoll(poll)} disabled={isActing} className="p-2 text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
