"use client";

import { useEffect } from "react";
import { listenForegroundPush } from "../lib/push";
import { useToast } from "./Toaster";

/**
 * Shows an in-app toast when an FCM push arrives while the app is open (the
 * service worker only renders notifications when the app is in the background).
 */
export function PushForegroundListener() {
  const toast = useToast();
  useEffect(() => {
    listenForegroundPush((title, body) => toast({ title, body }));
  }, [toast]);
  return null;
}
