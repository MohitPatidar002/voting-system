import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";
import { requireHousehold, errorResponse } from "../../../lib/auth";

const FEED_LIMIT = 30;

/**
 * A villager's notification feed = recent village broadcasts. The unread badge
 * is derived from a single `lastNotificationReadAt` stamp stored per household
 * in `household_meta`, so there is no per-user notification fan-out to maintain.
 */
export async function GET(request: Request) {
  try {
    const user = await requireHousehold(request);

    const [broadcastSnap, metaSnap] = await Promise.all([
      adminDb.collection("broadcasts").orderBy("createdAt", "desc").limit(FEED_LIMIT).get(),
      adminDb.collection("household_meta").doc(user.householdId).get(),
    ]);

    const lastReadAt = metaSnap.exists
      ? metaSnap.data()?.lastNotificationReadAt?.toDate?.()?.getTime() ?? 0
      : 0;

    let unreadCount = 0;
    const notifications = broadcastSnap.docs.map((doc) => {
      const data = doc.data();
      const createdMs = data.createdAt?.toDate?.().getTime() ?? 0;
      const isUnread = createdMs > lastReadAt;
      if (isUnread) unreadCount++;
      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        type: data.type,
        link: data.link || null,
        unread: isUnread,
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
      };
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return errorResponse(error, "Notifications Fetch Error");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireHousehold(request);
    // Mark everything up to now as read.
    await adminDb
      .collection("household_meta")
      .doc(user.householdId)
      .set({ lastNotificationReadAt: new Date() }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Notifications Update Error");
  }
}
