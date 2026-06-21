"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Loader2, BellRing, Power, Trash2 } from "lucide-react";
import { authFetch } from "../../../../lib/clientApi";

interface Notice {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  createdAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  general: "General",
  meeting: "Meeting",
  update: "Update",
  emergency: "Emergency",
};

export default function AdminNotices() {
  const { t } = useTranslation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({ title: "", content: "", type: "general" });

  const load = async () => {
    const res = await authFetch("/api/admin/notices");
    if (res.ok) setNotices((await res.json()).notices || []);
    setLoadingList(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setPosting(true);
    setError("");
    setSuccess("");
    try {
      const res = await authFetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post notice");
      setSuccess("Notice posted and villagers notified.");
      setFormData({ title: "", content: "", type: "general" });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPosting(false);
    }
  };

  const toggleActive = async (n: Notice) => {
    await authFetch("/api/admin/notices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noticeId: n.id, isActive: !n.isActive }),
    });
    load();
  };

  const remove = async (n: Notice) => {
    if (!confirm(`Delete notice "${n.title}"?`)) return;
    await authFetch(`/api/admin/notices?id=${n.id}`, { method: "DELETE" });
    load();
  };

  const inp = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">{t("notices")} Management</h1>

      {/* Post form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="font-bold flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" /> Post New Notice</h2>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}
          {success && <div className="p-3 bg-green-500/10 text-green-600 text-sm rounded-lg">{success}</div>}
          <input required maxLength={200} placeholder="Title *" className={inp} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <select className={inp} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
            <option value="general">General Information</option>
            <option value="meeting">Panchayat Meeting</option>
            <option value="update">Development Update</option>
            <option value="emergency">Emergency Alert</option>
          </select>
          <textarea required maxLength={5000} rows={5} placeholder="Notice content *" className={`${inp} h-auto`} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
          <button type="submit" disabled={posting} className="px-8 h-10 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2">
            {posting && <Loader2 className="h-4 w-4 animate-spin" />} Post Notice
          </button>
        </div>
      </form>

      {/* Notices list */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="font-bold">Posted Notices</h2>
        </div>
        <div className="divide-y divide-border">
          {loadingList ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : notices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No notices posted yet.</div>
          ) : (
            notices.map((n) => (
              <div key={n.id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {TYPE_LABELS[n.type] || n.type}
                    {n.createdAt && ` · ${new Date(n.createdAt).toLocaleDateString("en-IN")}`}
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(n)}
                  title={n.isActive ? "Deactivate" : "Reactivate"}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold shrink-0 ${n.isActive ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}
                >
                  <Power className="h-3.5 w-3.5" /> {n.isActive ? "Active" : "Hidden"}
                </button>
                <button onClick={() => remove(n)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
