"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { auth } from "../../../lib/firebase/config";
import { Loader2, Bell, Calendar, Search } from "lucide-react";
import { Notice } from "../../../types";

export default function UserNotices() {
  const { t } = useTranslation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch("/api/notices", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setNotices(data.notices);
        }
      } catch (err) {
        console.error("Failed to fetch notices", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNoticeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'border-destructive text-destructive bg-destructive/10';
      case 'meeting': return 'border-blue-500 text-blue-500 bg-blue-500/10';
      case 'update': return 'border-green-500 text-green-500 bg-green-500/10';
      default: return 'border-muted-foreground text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          {t("notices")}
        </h1>
        
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="p-8 text-center bg-card rounded-2xl border border-border shadow-sm">
          <p className="text-muted-foreground">No notices found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map(notice => (
            <div key={notice.id} className="p-5 md:p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-bold text-lg md:text-xl leading-tight">{notice.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getNoticeColor(notice.type)} capitalize shrink-0`}>
                  {notice.type}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4" />
                {new Date(notice.createdAt).toLocaleDateString()}
              </div>

              <div className="mt-2 text-muted-foreground text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {notice.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
