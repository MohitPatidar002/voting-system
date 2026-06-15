"use client";

import { useState } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Loader2, BellRing } from "lucide-react";
import { auth } from "../../../../lib/firebase/config";

export default function AdminNotices() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Authentication error.");

      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post notice");

      setSuccess("Notice posted successfully!");
      setFormData({ title: "", content: "", type: "general" });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">{t("notices")} Management</h1>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Post New Notice
          </h2>
        </div>

        <div className="p-6">
          {error && <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">{error}</div>}
          {success && <div className="mb-6 p-4 bg-green-500/10 text-green-600 rounded-lg border border-green-500/20">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                required
                type="text"
                maxLength={100}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notice Title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notice Type</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="general">General Information</option>
                <option value="meeting">Panchayat Meeting</option>
                <option value="update">Development Update</option>
                <option value="emergency">Emergency Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content *</label>
              <textarea
                required
                maxLength={1000}
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write the full notice content here..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 h-10 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Posting..." : "Post Notice"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
