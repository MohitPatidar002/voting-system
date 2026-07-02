import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText } from "../../../../lib/validate";

const PAGE_SIZE = 15;
const REVIEW_STATUSES = ["submitted", "under_review", "approved", "rejected", "forwarded"];

export async function GET(request: Request) {
  try {
    await requireCapability(request, "application:review");

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const statusFilter = searchParams.get("status");

    let query: FirebaseFirestore.Query = adminDb.collection("applications");
    if (statusFilter && REVIEW_STATUSES.includes(statusFilter)) {
      query = query.where("status", "==", statusFilter);
    }
    query = query.orderBy("createdAt", "desc").limit(PAGE_SIZE + 1);
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) query = query.startAfter(cursorDate);
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, PAGE_SIZE);
    const hasMore = snapshot.docs.length > PAGE_SIZE;

    const applications = docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        schemeName: data.schemeName,
        applicantName: data.applicantName,
        mobileNumber: data.mobileNumber,
        notes: data.notes || "",
        documentCount: Array.isArray(data.documents) ? data.documents.length : 0,
        status: data.status,
        reviewerNote: data.reviewerNote || "",
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate().toISOString() ?? null,
      };
    });

    const nextCursor = hasMore ? applications[applications.length - 1].createdAt : null;
    return NextResponse.json({ applications, nextCursor, hasMore });
  } catch (error) {
    return errorResponse(error, "Admin Applications Fetch Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "application:review");
    const body = await request.json();
    const { applicationId, status } = body;

    if (
      typeof applicationId !== "string" ||
      !["under_review", "approved", "rejected", "forwarded"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    const ref = adminDb.collection("applications").doc(applicationId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Only touch the reviewer note when the request actually carries one, so
    // a bare status change never erases a previously written note.
    const updates: Record<string, unknown> = { status, updatedAt: new Date() };
    if (body.reviewerNote !== undefined) {
      updates.reviewerNote = body.reviewerNote
        ? cleanText(body.reviewerNote, "Note", { min: 0, max: 2000 })
        : "";
    }
    await ref.update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Admin Applications Update Error");
  }
}
