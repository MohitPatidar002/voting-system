import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { app } from "./firebase/config";
import { authFetch } from "./clientApi";

const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "unsupported" | "denied" | "no-token" | "save-failed" | "error" };

/** True only when the browser supports push AND a VAPID key is configured. */
export async function isPushAvailable(): Promise<boolean> {
  try {
    return typeof window !== "undefined" && !!VAPID && (await isSupported());
  } catch {
    return false;
  }
}

/** Requests permission, registers the SW, and saves the FCM token server-side. */
export async function enablePush(): Promise<PushResult> {
  try {
    if (!VAPID) return { ok: false, reason: "not-configured" };
    if (!(await isSupported())) return { ok: false, reason: "unsupported" };

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID,
      serviceWorkerRegistration: registration,
    });
    if (!token) return { ok: false, reason: "no-token" };

    const res = await authFetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return { ok: false, reason: "save-failed" };

    return { ok: true };
  } catch (e) {
    console.error("enablePush error:", e);
    return { ok: false, reason: "error" };
  }
}

/** Shows in-app toasts when a push arrives while the app is open (foreground). */
export async function listenForegroundPush(cb: (title: string, body: string) => void): Promise<void> {
  if (!(await isSupported())) return;
  const messaging = getMessaging(app);
  onMessage(messaging, (payload) => {
    const d = payload.data || {};
    cb(d.title || "", d.body || "");
  });
}
