"use client";

import { useEffect, useState } from "react";
import { authFetch, ensureFreshRoleToken } from "../../../../lib/clientApi";
import { auth, storage } from "../../../../lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, Contact, Plus, Trash2, Phone, Pencil, X, Check } from "lucide-react";
import { DESIGNATIONS } from "../../../../lib/gramPanchayatData";

interface Member {
  id: string;
  name: string;
  designation: string;
  ward?: string;
  mobileNumber?: string;
  tenure?: string;
  photoUrl?: string;
  order?: number;
}

const emptyForm = {
  name: "", designation: DESIGNATIONS[0].value, ward: "", mobileNumber: "", tenure: "", order: "100",
};

export default function AdminDirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<typeof emptyForm, ""> & { photoUrl: string }>({ ...emptyForm, photoUrl: "" });
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = async () => {
    const res = await authFetch("/api/admin/directory");
    if (res.ok) setMembers((await res.json()).members || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      let photoUrl = "";
      if (photo) {
        await ensureFreshRoleToken();
        const uid = auth.currentUser?.uid;
        const path = `directory/${uid}_${Date.now()}_${photo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        await uploadBytes(ref(storage, path), photo);
        photoUrl = await getDownloadURL(ref(storage, path));
      }
      const res = await authFetch("/api/admin/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, order: Number(form.order) || 100, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg({ type: "ok", text: "Member added." });
      setForm(emptyForm);
      setPhoto(null);
      load();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: Member) => {
    setEditingId(m.id);
    setEditForm({
      name: m.name || "",
      designation: m.designation || DESIGNATIONS[0].value,
      ward: m.ward || "",
      mobileNumber: m.mobileNumber || "",
      tenure: m.tenure || "",
      order: String(m.order ?? 100),
      photoUrl: m.photoUrl || "",
    });
    setEditPhoto(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPhoto(null);
  };

  const saveEdit = async (id: string) => {
    setEditSaving(true);
    try {
      let photoUrl = editForm.photoUrl;
      if (editPhoto) {
        await ensureFreshRoleToken();
        const uid = auth.currentUser?.uid;
        const path = `directory/${uid}_${Date.now()}_${editPhoto.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        await uploadBytes(ref(storage, path), editPhoto);
        photoUrl = await getDownloadURL(ref(storage, path));
      }
      const res = await authFetch("/api/admin/directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm, order: Number(editForm.order) || 100, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEditingId(null);
      setEditPhoto(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEditSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    await authFetch(`/api/admin/directory?id=${id}`, { method: "DELETE" });
    load();
  };

  const inp = "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Contact className="h-6 w-6 text-primary" /> Village Directory</h1>

      {msg && <div className={`p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>{msg.text}</div>}

      {/* Add form */}
      <form onSubmit={submit} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Add Member</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input required placeholder="Name *" className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className={inp} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
            {DESIGNATIONS.map((d) => <option key={d.value} value={d.value}>{d.value} ({d.labelHi})</option>)}
          </select>
          <input placeholder="Ward (optional)" className={inp} value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
          <input type="tel" maxLength={10} placeholder="Mobile (10 digits)" className={inp} value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value.replace(/\D/g, "") })} />
          <input placeholder="Tenure e.g. 2022-2027" className={inp} value={form.tenure} onChange={(e) => setForm({ ...form, tenure: e.target.value })} />
          <input type="number" placeholder="Sort order (lower = top)" className={inp} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
        </div>
        <label className="block text-sm">Photo (optional)
          <input type="file" accept="image/*" className="block mt-1 text-sm" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </label>
        <button type="submit" disabled={saving} className="px-8 h-11 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add Member
        </button>
      </form>

      {/* Member list */}
      <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No members yet.</div>
        ) : (
          members.map((m) => (
            <div key={m.id}>
              {editingId === m.id ? (
                /* ── Inline edit row ── */
                <div className="p-4 space-y-3 bg-muted/30">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input required placeholder="Name *" className={inp} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    <select className={inp} value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}>
                      {DESIGNATIONS.map((d) => <option key={d.value} value={d.value}>{d.value} ({d.labelHi})</option>)}
                    </select>
                    <input placeholder="Ward (optional)" className={inp} value={editForm.ward} onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })} />
                    <input type="tel" maxLength={10} placeholder="Mobile (10 digits)" className={inp} value={editForm.mobileNumber} onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value.replace(/\D/g, "") })} />
                    <input placeholder="Tenure e.g. 2022-2027" className={inp} value={editForm.tenure} onChange={(e) => setEditForm({ ...editForm, tenure: e.target.value })} />
                    <input type="number" placeholder="Sort order" className={inp} value={editForm.order} onChange={(e) => setEditForm({ ...editForm, order: e.target.value })} />
                  </div>
                  <label className="block text-sm">New photo (leave blank to keep current)
                    <input type="file" accept="image/*" className="block mt-1 text-sm" onChange={(e) => setEditPhoto(e.target.files?.[0] || null)} />
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(m.id)} disabled={editSaving} className="flex items-center gap-1.5 px-4 h-9 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
                      {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 h-9 border border-border rounded-md text-sm font-medium">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Normal row ── */
                <div className="flex items-center gap-3 p-4">
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.designation}{m.ward ? ` · Ward ${m.ward}` : ""}</div>
                  </div>
                  {m.mobileNumber && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0"><Phone className="h-3 w-3" />{m.mobileNumber}</span>
                  )}
                  <button onClick={() => startEdit(m)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md shrink-0" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(m.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md shrink-0" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
