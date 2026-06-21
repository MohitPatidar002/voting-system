"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../../lib/firebase/config";
import { Loader2, AlertCircle, MessageSquare, Save } from "lucide-react";
import { Complaint } from "../../../../types";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [savingId, setSavingId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Record<string, {status: string, adminResponse: string}>>({});

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
        ? `/api/admin/complaints?cursor=${encodeURIComponent(cursor)}`
        : `/api/admin/complaints`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch complaints");

      if (!cursor) {
        setComplaints(data.complaints || []);
      } else {
        setComplaints(prev => [...prev, ...(data.complaints || [])]);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
      
      // Init local state for editing
      const initialUpdates: Record<string, {status: string, adminResponse: string}> = {};
      data.complaints?.forEach((c: Complaint) => {
        initialUpdates[c.id] = {
          status: c.status,
          adminResponse: c.adminResponse || "",
        };
      });
      setUpdates(prev => ({...prev, ...initialUpdates}));

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

  const handleUpdate = async (complaintId: string) => {
    try {
      setSavingId(complaintId);
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const updateData = updates[complaintId];

      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          complaintId, 
          status: updateData.status,
          adminResponse: updateData.adminResponse
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save update");
      }

      alert("Complaint updated successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
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
          <MessageSquare className="h-6 w-6" />
          Review & Resolve Complaints
        </h1>
        <p className="text-muted-foreground">
          Update the status of public complaints and provide official responses. The sender's identity is strictly hidden to prevent bias.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">No complaints require your attention right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {complaints.map(complaint => (
            <div key={complaint.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row">
              
              {/* Left Side: Complaint Details */}
              <div className="p-5 md:w-1/2 border-b md:border-b-0 md:border-r border-border">
                <h3 className="font-bold text-lg mb-1">{complaint.title}</h3>
                <div className="text-xs text-muted-foreground mb-4">
                  Reported on {new Date(complaint.createdAt).toLocaleDateString()}
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 whitespace-pre-wrap">
                  {complaint.description}
                </p>
                
                {complaint.images && complaint.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {complaint.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt="Complaint" className="h-20 w-20 rounded-lg object-cover border border-border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Resolution Action */}
              <div className="p-5 md:w-1/2 bg-muted/10 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={updates[complaint.id]?.status || complaint.status}
                    onChange={(e) => setUpdates(prev => ({...prev, [complaint.id]: {...prev[complaint.id], status: e.target.value}}))}
                    className="w-full p-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary"
                  >
                    {complaint.status === 'approved' && <option value="approved">✅ Approved — select action</option>}
                    <option value="in_progress">⏳ In Progress</option>
                    <option value="resolved">✅ Resolved</option>
                    <option value="unresolvable">❌ Cannot Fix</option>
                  </select>
                </div>

                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Official Panchayat Response</label>
                  <textarea
                    value={updates[complaint.id]?.adminResponse || ''}
                    onChange={(e) => setUpdates(prev => ({...prev, [complaint.id]: {...prev[complaint.id], adminResponse: e.target.value}}))}
                    placeholder="Write the reason or action taken here. This will be visible to the public."
                    className="w-full h-32 p-3 rounded-xl bg-background border border-border outline-none focus:border-primary resize-none text-sm"
                  />
                </div>

                <button
                  onClick={() => handleUpdate(complaint.id)}
                  disabled={savingId === complaint.id}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingId === complaint.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingId === complaint.id ? "Saving..." : "Save Official Response"}
                </button>
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
