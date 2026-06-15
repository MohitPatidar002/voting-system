"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Loader2, Plus, Users, Search } from "lucide-react";
import { auth } from "../../../../lib/firebase/config";
import { Household } from "../../../../types";

export default function AdminHouseholds() {
  const { t } = useTranslation();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    representativeName: "",
    mobileNumber: "",
    address: ""
  });

  const fetchHouseholds = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      
      const res = await fetch("/api/admin/households", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setHouseholds(data.households);
      }
    } catch (err) {
      console.error("Failed to fetch households", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      if (formData.mobileNumber.length !== 10) {
        throw new Error("Mobile number must be exactly 10 digits.");
      }

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Authentication error.");

      const res = await fetch("/api/admin/households", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add household");

      setSuccess("Household added successfully!");
      setFormData({ representativeName: "", mobileNumber: "", address: "" });
      fetchHouseholds();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("households")} Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden sticky top-6">
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Register New Household
              </h2>
            </div>
            <div className="p-4">
              {error && <div className="mb-4 p-3 text-sm bg-destructive/10 text-destructive rounded-lg">{error}</div>}
              {success && <div className="mb-4 p-3 text-sm bg-green-500/10 text-green-600 rounded-lg">{success}</div>}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Representative Name *</label>
                  <input
                    required
                    type="text"
                    maxLength={100}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.representativeName}
                    onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number (10 digits) *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      +91
                    </span>
                    <input
                      required
                      type="text"
                      maxLength={10}
                      className="flex h-10 w-full rounded-none rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <textarea
                    required
                    maxLength={200}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Register Household
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
             <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Registered Households
              </h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="pl-8 flex h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            
            <div className="p-0">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : households.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No households registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                      <tr>
                        <th className="px-6 py-3">Representative</th>
                        <th className="px-6 py-3">Mobile</th>
                        <th className="px-6 py-3">Address</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {households.map((h) => (
                        <tr key={h.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-medium">{h.representativeName}</td>
                          <td className="px-6 py-4 font-mono">{h.mobileNumber}</td>
                          <td className="px-6 py-4 truncate max-w-[200px]">{h.address}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${h.isActive ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                              {h.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
