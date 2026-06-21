import { adminDb, adminMessaging } from "./firebase/admin";
import type { BroadcastType } from "../types";

/**
 * Village-wide notification model.
 *
 * Instead of fanning out one notification document per household (expensive and
 * slow at village scale), we write a single `broadcasts` document per event.
 * Each villager's feed = recent broadcasts, and their unread badge = broadcasts
 * created after the `lastNotificationReadAt` stamp on their household-meta doc.
 *
 * We ALSO push a free FCM web-push to every subscribed device so villagers are
 * alerted in real time (e.g. a new scheme is open) even with the app closed.
 */
export async function createBroadcast(params: {
  title: string;
  body: string;
  type: BroadcastType;
  link?: string;
  createdBy: string;
}): Promise<void> {
  try {
    await adminDb.collection("broadcasts").add({
      title: params.title,
      body: params.body,
      type: params.type,
      link: params.link || null,
      createdBy: params.createdBy,
      createdAt: new Date(),
    });
  } catch (err) {
    // A failed broadcast must never fail the underlying action (scheme/notice
    // creation). Log and move on.
    console.error("Broadcast write failed:", err);
  }

  // Fire-and-forget push. Never let push failures affect the response.
  try {
    await sendPush(params.title, params.body, params.link || "/updates");
  } catch (err) {
    console.error("Push send failed:", err);
  }
}

async function sendPush(title: string, body: string, link: string): Promise<void> {
  const tokensSnap = await adminDb.collection("push_tokens").get();
  if (tokensSnap.empty) return;

  const tokenDocIds = tokensSnap.docs.map((d) => d.id);

  // FCM multicast handles up to 500 tokens per call.
  for (let i = 0; i < tokenDocIds.length; i += 500) {
    const batchTokens = tokenDocIds.slice(i, i + 500);
    const response = await adminMessaging.sendEachForMulticast({
      tokens: batchTokens,
      // Data-only payload: the service worker renders the notification, which
      // avoids the duplicate-notification problem of mixed notification+data.
      data: { title, body, link },
      webpush: {
        headers: { Urgency: "high" },
        fcmOptions: { link },
      },
    });

    // Clean up tokens the push service reports as permanently invalid.
    const stale: string[] = [];
    response.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code || "";
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-argument"
        ) {
          stale.push(batchTokens[idx]);
        }
      }
    });
    if (stale.length > 0) {
      await Promise.all(
        stale.map((t) => adminDb.collection("push_tokens").doc(t).delete().catch(() => {}))
      );
    }
  }
}
