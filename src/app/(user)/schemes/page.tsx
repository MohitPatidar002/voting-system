"use client";

import { useEffect, useState } from "react";
import { auth, storage } from "../../../lib/firebase/config";
import { ref, uploadBytes } from "firebase/storage";
import { authFetch } from "../../../lib/clientApi";
import { useTranslation } from "../../../hooks/useTranslation";
import {
  Loader2, FileText, CalendarClock, CheckCircle2, X, Upload,
  ExternalLink, AlertCircle, ShieldCheck,
} from "lucide-react";

interface Scheme {
  id: string;
  name: string;
  nameHi?: string;
  department: string;
  category: string;
  description: string;
  benefits: string;
  eligibility: string;
  requiredDocuments: string[];
  externalUrl?: string;
  acceptsInAppApplication: boolean;
  applicationEndDate: string | null;
}

export default function SchemesPage() {
  const { t, language } = useTranslation();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Scheme | null>(null);

  const load = async () => {
    try {
      const [schemesRes, appsRes] = await Promise.all([
        fetch("/api/schemes"),
        authFetch("/api/applications"),
      ]);
      const schemesData = await schemesRes.json();
      if (schemesRes.ok) setSchemes(schemesData.schemes || []);
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setAppliedIds(new Set((appsData.applications || []).map((a: { schemeId: string }) => a.schemeId)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const displayName = (s: Scheme) => (language === "hi" && s.nameHi ? s.nameHi : s.name);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <FileText className="h-6 w-6" /> {t("schemes")}
        </h1>
        <p className="text-muted-foreground">{t("schemesDesc")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : schemes.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">{t("noSchemes")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {schemes.map((s) => {
            const applied = appliedIds.has(s.id);
            return (
              <div key={s.id} className="flex flex-col bg-card rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg leading-tight">{displayName(s)}</h3>
                  {applied && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-bold">
                      <CheckCircle2 className="h-3 w-3" /> {t("statusSubmitted")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{s.description}</p>
                <div className="flex items-center gap-1.5 text-xs font-medium mb-4">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  {s.applicationEndDate ? (
                    <span className="text-orange-600">
                      {t("applyBefore")}: {new Date(s.applicationEndDate).toLocaleDateString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-green-600">{t("ongoing")}</span>
                  )}
                </div>
                <button
                  onClick={() => setActive(s)}
                  className="mt-auto w-full h-10 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {t("viewDetails")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {active && (
        <SchemeDetail
          scheme={active}
          alreadyApplied={appliedIds.has(active.id)}
          displayName={displayName(active)}
          onClose={() => setActive(null)}
          onApplied={() => {
            setAppliedIds((prev) => new Set(prev).add(active.id));
            setActive(null);
          }}
        />
      )}
    </div>
  );
}

function SchemeDetail({
  scheme, alreadyApplied, displayName, onClose, onApplied,
}: {
  scheme: Scheme;
  alreadyApplied: boolean;
  displayName: string;
  onClose: () => void;
  onApplied: () => void;
}) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const picked = Array.from(e.target.files);
      if (files.length + picked.length > 10) {
        setError(t("maxDocumentsError"));
        return;
      }
      setFiles((prev) => [...prev, ...picked]);
      setError("");
    }
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      setError("");
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error(t("somethingWrong"));

      // Upload each document to the applicant's PRIVATE folder. We store paths
      // only — never public URLs.
      const paths: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `applications/${uid}/${Date.now()}_${safeName}`;
        await uploadBytes(ref(storage, path), file);
        paths.push(path);
      }

      const res = await authFetch(`/api/schemes/${scheme.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: paths, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("somethingWrong"));
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg pr-4">{displayName}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm whitespace-pre-wrap">{scheme.description}</p>

          <Section title={t("benefits")} body={scheme.benefits} />
          <Section title={t("eligibility")} body={scheme.eligibility} />

          {scheme.requiredDocuments?.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-1">{t("requiredDocuments")}</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {scheme.requiredDocuments.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {alreadyApplied ? (
            <div className="bg-green-500/10 text-green-600 p-4 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5" /> {t("alreadyApplied")}
            </div>
          ) : scheme.acceptsInAppApplication ? (
            !showForm ? (
              <button onClick={() => setShowForm(true)} className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-medium">
                {t("applyNow")}
              </button>
            ) : (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                  {t("docsPrivateNote")}
                </div>
                <label className="block">
                  <span className="text-sm font-medium">{t("uploadDocuments")}</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-lg text-xs">
                        {f.name.slice(0, 18)}
                        <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <label className="inline-flex items-center gap-1 border-2 border-dashed border-border px-3 py-1 rounded-lg text-xs cursor-pointer hover:bg-muted/50">
                      <Upload className="h-3 w-3" /> {t("addPhoto")}
                      <input type="file" accept="image/*,application/pdf" multiple onChange={handleFiles} className="hidden" />
                    </label>
                  </div>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("additionalNotes")}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-background border border-border outline-none focus:border-primary resize-none text-sm"
                />
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {submitting ? t("uploading") : t("submitApplication")}
                </button>
              </div>
            )
          ) : scheme.externalUrl ? (
            <a
              href={scheme.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {t("applyExternally")} <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p>
    </div>
  );
}
