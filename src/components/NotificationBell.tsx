"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { authFetch } from "../lib/clientApi";

/**
 * Notification bell shown in the navbar for logged-in villagers. Polls the
 * unread count lightly; hidden for admins and signed-out visitors.
 */
export function NotificationBell() {
  const { user, isAdmin, loading } = useAuth();
  const [unread, setUnread] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading || !user || isAdmin) {
      setShow(false);
      return;
    }
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const res = await authFetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setUnread(data.unreadCount || 0);
          setShow(true);
        }
      } catch {
        /* ignore */
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, isAdmin, loading]);

  if (!show) return null;

  return (
    <Link
      href="/updates"
      aria-label="Notifications"
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent transition-colors"
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
