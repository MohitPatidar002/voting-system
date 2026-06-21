import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";
import { requireHousehold, errorResponse } from "../../../lib/auth";
import { enforceRateLimit } from "../../../lib/rateLimit";
import { cleanText, validateImageUrls } from "../../../lib/validate";

const PAGE_SIZE = 10;
const PUBLIC_STATUSES = ["approved", "in_progress", "resolved", "unresolvable"];

export async function POST(request: Request) {
  try {
    const user = await requireHousehold(request);

    // Anti-spam: cap complaints per household per hour.
    await enforceRateLimit("complaint", user.householdId, 5, 3600);

    const body = await request.json();
    const title = cleanText(body.title, "Title", { max: 150 });
    const description = cleanText(body.description, "Description", { max: 5000 });
    const images = validateImageUrls(body.images, 5);

    const now = new Date();
    const docRef = await adminDb.collection("complaints").add({
      householdId: user.householdId,
      title,
      description,
      images,
      status: "under_review",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, complaintId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Complaint Creation Error");
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    // Public feed: only complaints that have passed moderation. The reporter's
    // identity (householdId) is never returned.
    let query = adminDb
      .collection("complaints")
      .where("status", "in", PUBLIC_STATUSES)
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query = query.startAfter(cursorDate);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, PAGE_SIZE);
    const hasMore = snapshot.docs.length > PAGE_SIZE;

    const complaints = docs.map((doc) => {
      const { householdId, createdAt, updatedAt, ...rest } = doc.data();
      void householdId; // intentionally stripped for anonymity
      return {
        id: doc.id,
        ...rest,
        createdAt: createdAt?.toDate().toISOString() ?? null,
        updatedAt: updatedAt?.toDate().toISOString() ?? null,
      };
    });

    const nextCursor = hasMore ? complaints[complaints.length - 1].createdAt : null;

    return NextResponse.json(
      { complaints, nextCursor, hasMore },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    return errorResponse(error, "Fetch Complaints Error");
  }
}
