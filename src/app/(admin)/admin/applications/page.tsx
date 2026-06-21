"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../../../lib/clientApi";
import { Loader2, ClipboardList, FileText, Phone, Save, ShieldCheck } from "lucide-react";

interface Application {
  id: string;
  schemeName: string;
  applicantName: string;
  mobileNumber: string;
  notes: string;
  documentCount: number;
  status: string;
  reviewerNote: string;
  createdAt: string;
}

const STATUSES = ["submitted", "under_review", "approved", "rejected", "forwarded"];
const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-600",
  under_review: "bg-orange-500/10 text-orange-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
  forwarded: "bg-violet-500/10 text-violet-600",
};

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { status: string; reviewerNote: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);

  const load = async (cursor: string | null = null) => {
    const url = cursor ? `/api/admin/applications?cursor=${encodeURIComponent(cursor)}` : "/api/admin/applications";
    const res = await authFetch(url);
    if (res.ok) {
      const data = await res.json();
      setApps((prev) => (cursor ? [...prev, ...data.applications] : data.applications));
      setNextCursor(data.nextCursor);
      const init: Record<string, { status: string; reviewerNote: string }> = {};
      data.applications.forEach((a: Application) => { init[a.id] = { status: a.status, reviewerNote: a.reviewerNote }; });
      setEdits((p) => ({ ...p, ...init }));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const viewDocument = async (appId: string, index: number) => {
    const key = `${appId}_${index}`;
    setOpeningDoc(key);
    try {
      const res = await authFetch(`/api/applications/${appId}/document?index=${index}`);
      const data = await res.json();
      if (res.ok && data.url) window.open(data.url, "_blank", "noopener");
      else alert(data.error || "Could not open document");
    } finally {
      setOpeningDoc(null);
    }
  };

  const save = async (appId: string) => {
    setSavingId(appId);
    try {
      const res = await authFetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: appId, ...edits[appId] }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, ...edits[appId] } : a)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" /> Scheme Applications</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
          <ShieldCheck className="h-4 w-4 text-green-600" /> Documents open via secure one-time links and are visible only to you.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border text-muted-foreground">No applications yet.</div>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <div key={a.id} className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold">{a.schemeName}</h3>
                  <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-x-3">
                    <span>{a.applicantName}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{a.mobileNumber}</span>
                  </div>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[a.status] || "bg-muted"}`}>{a.status}</span>
              </div>

              {a.notes && <p className="text-sm bg-muted/40 rounded-lg p-3 mb-3">{a.notes}</p>}

              {a.documentCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {Array.from({ length: a.documentCount }).map((_, i) => (
                    <button key={i} onClick={() => viewDocument(a.id, i)} disabled={openingDoc === `${a.id}_${i}`}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-input bg-background hover:bg-accent text-xs font-medium disabled:opacity-50">
                      {openingDoc === `${a.id}_${i}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      Document {i + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 border-t border-border pt-3">
                <select value={edits[a.id]?.status || a.status} onChange={(e) => setEdits((p) => ({ ...p, [a.id]: { ...p[a.id], status: e.target.value } }))}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={edits[a.id]?.reviewerNote || ""} onChange={(e) => setEdits((p) => ({ ...p, [a.id]: { ...p[a.id], reviewerNote: e.target.value } }))}
                  placeholder="Note to applicant (optional)" className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm" />
                <button onClick={() => save(a.id)} disabled={savingId === a.id}
                  className="h-10 px-5 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                </button>
              </div>
            </div>
          ))}
          {nextCursor && (
            <div className="flex justify-center pt-2">
              <button onClick={() => load(nextCursor)} className="px-6 py-2.5 bg-muted hover:bg-muted/80 rounded-xl font-medium text-sm">Load More</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
