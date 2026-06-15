"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { auth } from "../../../../lib/firebase/config";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { use } from "react";
import Link from "next/link";

export default function PollVotingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pollId = resolvedParams.id;
  const { t } = useTranslation();
  const [poll, setPoll] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPoll = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`/api/polls/${pollId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPoll(data.poll);
        setHasVoted(data.hasVoted);
        setUserVotes(data.userVotes || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load poll details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const submitVote = async () => {
    if (hasVoted || selectedOptions.length === 0) return;

    setVoting(true);
    setError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Authentication error.");

      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ optionIds: selectedOptions })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit vote");

      setSuccess("Your vote has been securely recorded!");
      setHasVoted(true);
      setUserVotes(selectedOptions);
      // Re-fetch to get updated total votes
      fetchPoll();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="text-center p-8 bg-destructive/10 rounded-xl border border-destructive text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
        <Link href="/dashboard" className="inline-block mt-4 text-primary underline">Return to Dashboard</Link>
      </div>
    );
  }

  if (!poll) return null;

  const now = new Date();
  const start = new Date(poll.startDate);
  const end = new Date(poll.endDate);
  const isClosed = poll.status !== "open" && (now < start || now > end);
  
  // Calculate percentages for results (only shown if voted or closed)
  const totalVotes = poll.totalVotes || 0;
  const showResults = hasVoted || isClosed;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 pb-8">
      <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
      </Link>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted w-fit px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            {isClosed ? t("votingClosed") : `${t("closesAt")}: ${end.toLocaleString()}`}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
            {poll.title}
          </h1>
          
          <p className="text-muted-foreground text-lg leading-relaxed">
            {poll.description}
          </p>

          {error && <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">{error}</div>}
          {success && <div className="p-4 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20 font-medium flex items-center gap-2"><CheckCircle2 className="h-5 w-5"/>{success}</div>}

          <div className="pt-6 space-y-4">
            {poll.options.map((opt: any) => {
              const votesForOption = poll.results?.[opt.id] || 0;
              const percentage = totalVotes > 0 ? Math.round((votesForOption / totalVotes) * 100) : 0;
              const isSelected = userVotes.includes(opt.id);
              const isChecking = selectedOptions.includes(opt.id);

              return (
                <div key={opt.id} className="relative">
                  {showResults ? (
                    // Result View
                    <div className={`p-4 rounded-2xl border-2 overflow-hidden relative z-10 ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary/10 -z-10 transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="flex justify-between items-center font-medium">
                        <div className="flex items-center gap-2 text-lg">
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          {opt.text}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xl">{percentage}%</span>
                          {isClosed && <div className="text-xs text-muted-foreground">{votesForOption} votes</div>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Voting View
                    <button
                      onClick={() => {
                        if (poll.allowMultiple) {
                          setSelectedOptions(prev => 
                            prev.includes(opt.id) ? prev.filter(id => id !== opt.id) : [...prev, opt.id]
                          );
                        } else {
                          setSelectedOptions([opt.id]);
                        }
                      }}
                      disabled={voting || isClosed}
                      className={`w-full p-5 rounded-2xl border-2 transition-all text-left group disabled:opacity-50 ${isChecking ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xl font-medium transition-colors ${isChecking ? 'text-primary' : 'group-hover:text-primary/70'}`}>{opt.text}</span>
                        
                        {poll.allowMultiple ? (
                          <div className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${isChecking ? 'border-primary bg-primary' : 'border-muted-foreground group-hover:border-primary/50'}`}>
                            {isChecking && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                          </div>
                        ) : (
                          <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${isChecking ? 'border-primary' : 'border-muted-foreground group-hover:border-primary/50'}`}>
                            <div className={`h-3 w-3 rounded-full transition-colors ${isChecking ? 'bg-primary' : 'bg-transparent'}`} />
                          </div>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!showResults && (
            <div className="pt-4">
              <button
                onClick={submitVote}
                disabled={selectedOptions.length === 0 || voting || isClosed}
                className="w-full sm:w-auto px-8 h-12 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {voting && <Loader2 className="h-5 w-5 animate-spin" />}
                {voting ? t("submitting") : t("submitVote")}
              </button>
            </div>
          )}
          
          {showResults && (
            <div className="pt-6 text-center text-muted-foreground font-medium">
              {t("totalValidVotes")}: {totalVotes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
