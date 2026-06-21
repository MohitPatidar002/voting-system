"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "../../../lib/clientApi";
import { useTranslation } from "../../../hooks/useTranslation";
import { EnablePushButton } from "../../../components/EnablePushButton";
import { Loader2, Bell, FileText, Megaphone, Vote, HardHat, CheckCheck, Landmark } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  unread: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, typeof Bell> = {
  scheme: FileText,
  notice: Megaphone,
  poll: Vote,
  project: HardHat,
  meeting: Landmark,
  general: Bell,
};

export default function UpdatesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await authFetch("/api/notifications");
      const data = await res.json();
      if (res.ok) setItems(data.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async () => {
    await authFetch("/api/notifications", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Bell className="h-6 w-6" /> {t("updates")}
          </h1>
          <p className="text-muted-foreground">{t("updatesDesc")}</p>
          <div className="mt-2"><EnablePushButton /></div>
        </div>
        {items.some((n) => n.unread) && (
          <button onClick={markRead} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0">
            <CheckCheck className="h-4 w-4" /> {t("markAllRead")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = TYPE_ICON[n.type] || Bell;
            const inner = (
              <div className={`flex gap-3 p-4 rounded-2xl border shadow-sm ${n.unread ? "bg-primary/5 border-primary/30" : "bg-card border-border"}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{n.title}</h3>
                    {n.unread && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString("en-IN")}</div>
                </div>
              </div>
            );
            return n.link ? <Link key={n.id} href={n.link}>{inner}</Link> : <div key={n.id}>{inner}</div>;
          })}
        </div>
      )}
    </div>
  );
}
