"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../../lib/firebase/config";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Eye, ShieldAlert } from "lucide-react";

interface ModerationComplaint {
  id: string;
  representativeName: string;
  title: string;
  description: string;
  images: string[];
  status: string;
  createdAt: string;
}

export default function ModerationPage() {
  const [complaints, setComplaints] = useState<ModerationComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async (cursor: string | null = null) => {
    try {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const url = cursor
        ? `/api/admin/moderation?cursor=${encodeURIComponent(cursor)}`
        : `/api/admin/moderation`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch moderation queue");

      if (!cursor) {
        setComplaints(data.complaints || []);
      } else {
        setComplaints(prev => [...prev, ...(data.complaints || [])]);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (nextCursor) fetchComplaints(nextCursor);
  };

  const handleAction = async (complaintId: string, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(complaintId);
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ complaintId, status })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      setComplaints(prev => prev.filter(c => c.id !== complaintId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-orange-500" />
          Superadmin Moderation Queue
        </h1>
        <p className="text-muted-foreground">
          Review new complaints. If approved, they will be public but the sender's identity will be permanently hidden from the Reviewer and public.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">Queue is empty. No new complaints to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {complaints.map(complaint => (
            <div key={complaint.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{complaint.title}</h3>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      True Sender: <span className="font-bold text-foreground">{complaint.representativeName}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-orange-500/10 text-orange-600 border-orange-500/20">
                    Under Review
                  </span>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/50">
                  {complaint.description}
                </p>
                
                {complaint.images && complaint.images.length > 0 && (
                  <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-thin">
                    {complaint.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt="Complaint" className="h-32 w-auto rounded-lg object-cover border border-border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-6 border-t border-border pt-4">
                  <button
                    onClick={() => handleAction(complaint.id, 'approved')}
                    disabled={actionLoading === complaint.id}
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === complaint.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve & Make Public
                  </button>
                  <button
                    onClick={() => handleAction(complaint.id, 'rejected')}
                    disabled={actionLoading === complaint.id}
                    className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-xl font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === complaint.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject / Spam
                  </button>
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
