import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText } from "../../../../lib/validate";

const PAGE_SIZE = 10;
const VISIBLE_STATUSES = ["approved", "in_progress", "resolved", "unresolvable"];
const ALLOWED_PROGRESS = ["approved", "in_progress", "resolved", "unresolvable"];

export async function GET(request: Request) {
  try {
    await requireCapability(request, "complaint:updateProgress");

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    // Admins/reviewers see moderated complaints only — never under_review or
    // rejected, and never the reporter's identity.
    let query = adminDb
      .collection("complaints")
      .where("status", "in", VISIBLE_STATUSES)
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) query = query.startAfter(cursorDate);
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, PAGE_SIZE);
    const hasMore = snapshot.docs.length > PAGE_SIZE;

    const complaints = docs.map((doc) => {
      const { householdId, createdAt, updatedAt, ...rest } = doc.data();
      void householdId;
      return {
        id: doc.id,
        ...rest,
        createdAt: createdAt?.toDate().toISOString() ?? null,
        updatedAt: updatedAt?.toDate().toISOString() ?? null,
      };
    });

    const nextCursor = hasMore ? complaints[complaints.length - 1].createdAt : null;

    return NextResponse.json({ complaints, nextCursor, hasMore });
  } catch (error) {
    return errorResponse(error, "Admin Complaints Fetch Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "complaint:updateProgress");
    const body = await request.json();
    const { complaintId, status } = body;

    if (typeof complaintId !== "string" || !ALLOWED_PROGRESS.includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const ref = adminDb.collection("complaints").doc(complaintId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }
    // Progress can only move forward on already-public complaints — never on
    // items still under review or rejected. History is preserved (no deletes).
    if (!VISIBLE_STATUSES.includes(snap.data()?.status)) {
      return NextResponse.json(
        { error: "This complaint is not open for progress updates." },
        { status: 409 }
      );
    }

    // Only touch the official response when the request actually carries one,
    // so a bare status change never erases a previously posted response.
    const updates: Record<string, unknown> = { status, updatedAt: new Date() };
    if (body.adminResponse !== undefined) {
      updates.adminResponse =
        body.adminResponse === ""
          ? ""
          : cleanText(body.adminResponse, "Response", { min: 0, max: 5000 });
    }
    await ref.update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Admin Complaints Update Error");
  }
}
