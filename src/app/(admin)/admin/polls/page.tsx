"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Loader2, Plus, Trash2, CalendarClock } from "lucide-react";
import { auth } from "../../../../lib/firebase/config";
import Link from "next/link";

export default function AdminPolls() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [polls, setPolls] = useState<any[]>([]);
  const [fetchingPolls, setFetchingPolls] = useState(true);
  const [adminRole, setAdminRole] = useState<string>("admin");

  const fetchRoleAndPolls = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Fetch Role
      const roleRes = await fetch("/api/admin/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        setAdminRole(roleData.role);
      }

      // Fetch Polls
      const pollsRes = await fetch("/api/admin/polls", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (pollsRes.ok) {
        const pollsData = await pollsRes.json();
        setPolls(pollsData.polls);
      }
    } catch (err) {
      console.error("Failed to fetch data");
    } finally {
      setFetchingPolls(false);
    }
  };

  useEffect(() => {
    fetchRoleAndPolls();
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    type: "multiple_choice",
    allowMultiple: false,
    options: [{ id: "1", text: "Option 1" }, { id: "2", text: "Option 2" }]
  });

  const updateOption = (index: number, text: string) => {
    const newOptions = [...formData.options];
    newOptions[index].text = text;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    if (formData.options.length >= 10) return;
    setFormData({
      ...formData,
      options: [...formData.options, { id: Date.now().toString(), text: `Option ${formData.options.length + 1}` }]
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return;
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      // Frontend Validation
      if (end <= start) {
        throw new Error("End date & time must be after the start date & time.");
      }
      
      const durationMins = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMins < 30) {
        throw new Error("Poll must be open for at least 30 minutes.");
      }

      // Check auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Authentication error. Please login again.");

      const res = await fetch("/api/admin/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create poll");

      setSuccess("Poll created successfully!");
      fetchRoleAndPolls(); // Refresh the list
      // Reset form (except type)
      setFormData({
        ...formData,
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        allowMultiple: false,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("polls")} Management</h1>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Create New Poll
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure specific time slots for voting (e.g. Jun 15, 12:00 PM to 02:00 PM).
          </p>
        </div>

        <div className="p-6">
          {error && <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">{error}</div>}
          {success && <div className="mb-6 p-4 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-lg">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Poll Title <span className="text-destructive">*</span></label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Village Road Development Budget Approval"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description <span className="text-destructive">*</span></label>
                <textarea
                  required
                  maxLength={500}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about the poll..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date & Time <span className="text-destructive">*</span></label>
                  <input
                    required
                    type="datetime-local"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date & Time <span className="text-destructive">*</span></label>
                  <input
                    required
                    type="datetime-local"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                <label className="block text-sm font-medium">Custom Voting Options <span className="text-destructive">*</span></label>
                  {formData.options.map((opt, index) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        required
                        type="text"
                        maxLength={50}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={opt.text}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        disabled={formData.options.length <= 2}
                        className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  {formData.options.length < 10 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Option
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="allowMultiple"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.allowMultiple}
                      onChange={(e) => setFormData({ ...formData, allowMultiple: e.target.checked })}
                    />
                    <label htmlFor="allowMultiple" className="text-sm font-medium">
                      Allow voters to select multiple options
                    </label>
                  </div>
                </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 h-10 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Poll"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-xl font-bold">Previous Polls</h2>
          <p className="text-sm text-muted-foreground mt-1">All polls created by admins.</p>
        </div>
        <div className="p-6">
          {fetchingPolls ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : polls.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">No polls created yet.</div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => {
                const start = new Date(poll.startDate);
                const end = new Date(poll.endDate);
                const now = new Date();
                let statusBadge = <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full font-medium">Draft/Scheduled</span>;
                
                if (now >= start && now <= end) {
                  statusBadge = <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full font-medium">Active</span>;
                } else if (now > end) {
                  statusBadge = <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded-full font-medium">Expired/Closed</span>;
                }

                return (
                  <div key={poll.id} className="p-4 border border-border rounded-lg bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">{poll.title} {statusBadge}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{poll.description}</p>
                      <div className="flex gap-4 mt-2 text-xs font-medium text-muted-foreground">
                        <span>Start: {start.toLocaleString()}</span>
                        <span>End: {end.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right shrink-0 flex flex-col items-end gap-3">
                      <div>
                        <div className="text-2xl font-bold">{poll.totalVotes || 0}</div>
                        <div className="text-xs text-muted-foreground">Total Votes</div>
                      </div>
                      {adminRole === "superadmin" && (
                        <Link 
                          href={`/admin/polls/${poll.id}`}
                          className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                        >
                          View Detailed Votes
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
