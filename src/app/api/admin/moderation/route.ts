import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
  try {
    await requireCapability(request, "complaint:moderate");

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    let query = adminDb
      .collection("complaints")
      .where("status", "==", "under_review")
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) query = query.startAfter(cursorDate);
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, PAGE_SIZE);
    const hasMore = snapshot.docs.length > PAGE_SIZE;

    // Batch-resolve reporter identities (superadmin-only) in a single read
    // instead of one lookup per complaint (avoids the N+1).
    const householdIds = [
      ...new Set(
        docs.map((d) => d.data().householdId).filter((id): id is string => !!id)
      ),
    ];
    const nameById: Record<string, string> = {};
    if (householdIds.length > 0) {
      const refs = householdIds.map((id) => adminDb.collection("households").doc(id));
      const householdDocs = await adminDb.getAll(...refs);
      householdDocs.forEach((doc) => {
        if (doc.exists) nameById[doc.id] = doc.data()?.representativeName || "Unknown";
      });
    }

    const complaints = docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        images: data.images || [],
        status: data.status,
        representativeName: data.householdId
          ? nameById[data.householdId] || "Unknown"
          : "Unknown",
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate().toISOString() ?? null,
      };
    });

    const nextCursor = hasMore ? complaints[complaints.length - 1].createdAt : null;

    return NextResponse.json({ complaints, nextCursor, hasMore });
  } catch (error) {
    return errorResponse(error, "Moderation Fetch Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "complaint:moderate");
    const body = await request.json();
    const { complaintId, status } = body;

    if (typeof complaintId !== "string" || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const ref = adminDb.collection("complaints").doc(complaintId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }
    // Only items still awaiting moderation can be approved/rejected here.
    if (snap.data()?.status !== "under_review") {
      return NextResponse.json(
        { error: "This complaint has already been moderated." },
        { status: 409 }
      );
    }

    await ref.update({ status, updatedAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Moderation Update Error");
  }
}
