"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Loader2, Plus, Users, Search, Pencil, X, Check, Power, Trash2 } from "lucide-react";
import { authFetch } from "../../../../lib/clientApi";

interface Household {
  id: string;
  representativeName: string;
  mobileNumber: string;
  address: string;
  isActive: boolean;
  registrationDate?: string;
}

const emptyForm = { representativeName: "", mobileNumber: "", address: "" };

export default function AdminHouseholds() {
  const { t } = useTranslation();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(emptyForm);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ representativeName: "", address: "" });
  const [editSaving, setEditSaving] = useState(false);

  const fetchHouseholds = async () => {
    try {
      const res = await authFetch("/api/admin/households");
      if (res.ok) setHouseholds((await res.json()).households || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchHouseholds(); }, []);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      if (formData.mobileNumber.length !== 10) throw new Error("Mobile number must be exactly 10 digits.");
      const res = await authFetch("/api/admin/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add household");
      setSuccess("Household registered.");
      setFormData(emptyForm);
      fetchHouseholds();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (h: Household) => {
    setEditingId(h.id);
    setEditForm({ representativeName: h.representativeName, address: h.address });
  };

  const saveEdit = async (id: string) => {
    setEditSaving(true);
    try {
      const res = await authFetch("/api/admin/households", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId: id, ...editForm }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setEditingId(null);
      fetchHouseholds();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEditSaving(false);
    }
  };

  const toggleActive = async (h: Household) => {
    await authFetch("/api/admin/households", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ householdId: h.id, isActive: !h.isActive }),
    });
    fetchHouseholds();
  };

  const remove = async (h: Household) => {
    if (!confirm(`Permanently delete household "${h.representativeName}" (${h.mobileNumber})? This cannot be undone and will remove their access.`)) return;
    await authFetch(`/api/admin/households?id=${h.id}`, { method: "DELETE" });
    fetchHouseholds();
  };

  const inp = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? households.filter((h) => h.representativeName?.toLowerCase().includes(term) || h.mobileNumber?.includes(term))
    : households;

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold">{t("households")} Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden sticky top-6">
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="text-base font-bold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Register New Household</h2>
            </div>
            <div className="p-4">
              {error && <div className="mb-3 p-3 text-sm bg-destructive/10 text-destructive rounded-lg">{error}</div>}
              {success && <div className="mb-3 p-3 text-sm bg-green-500/10 text-green-600 rounded-lg">{success}</div>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <input required maxLength={100} className={inp} value={formData.representativeName} onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Mobile (10 digits) *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+91</span>
                    <input required maxLength={10} className={`${inp} rounded-l-none`} value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, "") })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Address *</label>
                  <textarea required maxLength={200} rows={2} className={`${inp} h-auto`} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <button type="submit" disabled={formLoading} className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />} Register
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Household list */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-base font-bold flex items-center gap-2 flex-1"><Users className="h-4 w-4 text-primary" /> Registered Households</h2>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search name / mobile..." className="pl-8 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">{households.length === 0 ? "No households registered yet." : "No matches."}</div>
              ) : (
                filtered.map((h) => (
                  <div key={h.id}>
                    {editingId === h.id ? (
                      <div className="p-4 bg-muted/30 space-y-3">
                        <input maxLength={100} className={inp} value={editForm.representativeName} onChange={(e) => setEditForm({ ...editForm, representativeName: e.target.value })} placeholder="Name" />
                        <textarea maxLength={200} rows={2} className={`${inp} h-auto`} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Address" />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(h.id)} disabled={editSaving} className="flex items-center gap-1 px-4 h-8 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
                            {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-4 h-8 border border-border rounded-md text-sm font-medium">
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{h.representativeName}</div>
                          <div className="text-sm text-muted-foreground font-mono">{h.mobileNumber}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{h.address}</div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${h.isActive ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                          {h.isActive ? "Active" : "Inactive"}
                        </span>
                        <button onClick={() => startEdit(h)} title="Edit" className="p-1.5 text-muted-foreground hover:bg-muted rounded-md shrink-0">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleActive(h)} title={h.isActive ? "Deactivate" : "Reactivate"} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md shrink-0">
                          <Power className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(h)} title="Delete" className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
