"use client";

import { useEffect, useState, use } from "react";
import { Loader2, ArrowLeft, Download, Users, FileSpreadsheet } from "lucide-react";
import { auth } from "../../../../../lib/firebase/config";
import Link from "next/link";

export default function AdminPollDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pollId = resolvedParams.id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [poll, setPoll] = useState<any>(null);
  const [votes, setVotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetailedVotes = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Authentication required");

        const res = await fetch(`/api/admin/polls/${pollId}/votes`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch data");

        setPoll(data.poll);
        setVotes(data.votes || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedVotes();
  }, [pollId]);

  const exportToCSV = () => {
    if (!votes.length) return;

    const headers = ["Household Name", "Mobile Number", "Address", "Voted Option", "Timestamp"];
    const rows = votes.map(v => [
      `"${v.representativeName}"`,
      `"${v.mobileNumber}"`,
      `"${v.address}"`,
      `"${v.optionSelected}"`,
      `"${v.timestamp ? new Date(v.timestamp).toLocaleString() : 'N/A'}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `poll_${pollId}_votes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/admin/polls" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Polls
        </Link>
        <div className="p-6 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center space-y-2">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link href="/admin/polls" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Polls
        </Link>
        <button
          onClick={exportToCSV}
          disabled={votes.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-2 border-b border-border bg-muted/20">
          <h1 className="text-2xl md:text-3xl font-extrabold">{poll?.title}</h1>
          <p className="text-muted-foreground text-lg">{poll?.description}</p>
          <div className="pt-2 flex items-center gap-2 text-primary font-medium">
            <Users className="h-5 w-5" /> Total Votes Cast: {votes.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          {votes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No votes have been cast for this poll yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-4 font-semibold text-sm">Household</th>
                  <th className="p-4 font-semibold text-sm">Mobile</th>
                  <th className="p-4 font-semibold text-sm">Address</th>
                  <th className="p-4 font-semibold text-sm text-primary">Voted Option</th>
                  <th className="p-4 font-semibold text-sm">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {votes.map((vote) => (
                  <tr key={vote.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{vote.representativeName}</td>
                    <td className="p-4 text-sm text-muted-foreground">{vote.mobileNumber}</td>
                    <td className="p-4 text-sm text-muted-foreground">{vote.address}</td>
                    <td className="p-4 font-bold text-primary">{vote.optionSelected}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {vote.timestamp ? new Date(vote.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
