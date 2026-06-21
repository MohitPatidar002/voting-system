"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2, BellOff } from "lucide-react";
import { enablePush, isPushAvailable } from "../lib/push";
import { useTranslation } from "../hooks/useTranslation";

/**
 * "Turn on phone alerts" button. Hidden entirely when push isn't available
 * (unsupported browser or no VAPID key configured), so it never shows a broken
 * control to villagers.
 */
export function EnablePushButton() {
  const { t } = useTranslation();
  const [available, setAvailable] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "on" | "denied">("idle");

  useEffect(() => {
    isPushAvailable().then((ok) => {
      setAvailable(ok);
      if (ok && typeof Notification !== "undefined" && Notification.permission === "granted") {
        setState("on");
      } else if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setState("denied");
      }
    });
  }, []);

  if (!available) return null;

  const click = async () => {
    setState("loading");
    const res = await enablePush();
    if (res.ok) setState("on");
    else if (res.reason === "denied") setState("denied");
    else setState("idle");
  };

  if (state === "on") {
    return (
      <div className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
        <BellRing className="h-4 w-4" /> {t("alertsOn")}
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" /> {t("alertsDenied")}
      </div>
    );
  }

  return (
    <button
      onClick={click}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
    >
      {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
      {t("enableAlerts")}
    </button>
  );
}
