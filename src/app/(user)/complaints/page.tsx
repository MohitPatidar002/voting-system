"use client";

import { useState, useEffect } from "react";
import { auth, storage } from "../../../lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, AlertCircle, CheckCircle2, Upload, X, MessageSquare, Image as ImageIcon } from "lucide-react";
import { Complaint } from "../../../types";
import { useTranslation } from "../../../hooks/useTranslation";

export default function ComplaintsPage() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async (cursor: string | null = null) => {
    try {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);

      const url = cursor
        ? `/api/complaints?cursor=${encodeURIComponent(cursor)}`
        : `/api/complaints`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        if (!cursor) {
          setComplaints(data.complaints);
        } else {
          setComplaints(prev => [...prev, ...data.complaints]);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (nextCursor) fetchComplaints(nextCursor);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 5) {
        setError(t("maxImagesError"));
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
      setError("");
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError(t("titleDescRequired"));
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("somethingWrong"));

      // Upload Images. The filename is sanitized to a single safe path segment
      // so it can never escape the public `complaints/` folder the rules allow.
      const imageUrls: string[] = [];
      for (const file of images) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const imageRef = ref(storage, `complaints/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      }

      // The backend securely extracts your householdId from your auth token!
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, images: imageUrls })
      });

      if (!res.ok) throw new Error(t("somethingWrong"));

      setSuccess(true);
      setTitle("");
      setDescription("");
      setImages([]);

      // We don't fetchComplaints because new ones go into 'under_review'.
    } catch (err: any) {
      setError(err.message || t("somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'unresolvable': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved': return t("statusResolved");
      case 'in_progress': return t("statusInProgress");
      case 'unresolvable': return t("statusUnresolvable");
      case 'approved': return t("statusPending");
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary">{t("publicComplaintBox")}</h1>
        <p className="text-muted-foreground">
          {t("complaintBoxDesc")}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Side: Complaint Form */}
        <div className="w-full md:w-1/3 md:sticky md:top-24">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("submitNewIssue")}
            </h2>

        {success ? (
          <div className="bg-green-500/10 text-green-600 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p>{t("successComplaint")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("issueTitle")}</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("issueTitlePlaceholder")}
                className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("detailedDescription")}</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={4}
                className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("uploadPhotos")}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={URL.createObjectURL(file)} alt="Preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                    <ImageIcon className="h-6 w-6 mb-1" />
                    <span className="text-[10px]">{t("addPhoto")}</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {submitting ? t("uploading") : t("submitAnonymously")}
            </button>
          </form>
        )}
          </div>
        </div>

        {/* Right Side: Public Feed */}
        <div className="w-full md:w-2/3 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">{t("publicFeed")}</h2>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-2xl border border-border shadow-sm">
              <p className="text-muted-foreground">{t("noComplaints")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map(complaint => (
                <div key={complaint.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg">{complaint.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(complaint.status)}`}>
                        {getStatusText(complaint.status)}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4 whitespace-pre-wrap">{complaint.description}</p>
                    
                    {complaint.images && complaint.images.length > 0 && (
                      <div className="flex overflow-x-auto gap-2 pb-2 mb-2 scrollbar-thin">
                        {complaint.images.map((img, i) => (
                          <img key={i} src={img} alt="Complaint" className="h-32 w-auto rounded-lg object-cover border border-border" />
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-4">
                      {t("reportedOn")} {new Date(complaint.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Admin Response Section */}
                  {complaint.adminResponse && (
                    <div className="bg-muted/50 p-4 border-t border-border">
                      <div className="flex items-start gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-primary block mb-1">{t("officialResponse")}</span>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{complaint.adminResponse}</p>
                        </div>
                      </div>
                    </div>
                  )}
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
                    {loadingMore ? t("loading") : t("loadMore")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
