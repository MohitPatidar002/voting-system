import { NextResponse } from "next/server";
import { adminDb, adminBucket } from "../../../../../lib/firebase/admin";
import { verifyToken, resolveRole, errorResponse, AuthError } from "../../../../../lib/auth";
import { roleHasCapability } from "../../../../../lib/permissions";

/**
 * Mints a short-lived signed URL for a single application document.
 *
 * Application documents are stored privately (Storage rules deny direct reads),
 * so the ONLY way to view one is through this route, which first proves the
 * caller is either:
 *   - the household that owns the application, or
 *   - a staff member with the `application:review` capability.
 * This is the gate that guarantees one villager's documents can never be
 * fetched by anyone else.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { phone } = await verifyToken(request);
    const { id: applicationId } = await params;
    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get("index") || "0", 10);

    const appSnap = await adminDb.collection("applications").doc(applicationId).get();
    if (!appSnap.exists) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    const app = appSnap.data()!;
    const documents: string[] = Array.isArray(app.documents) ? app.documents : [];
    if (index < 0 || index >= documents.length) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Ownership check: is this caller the household that filed the application?
    const householdSnap = await adminDb
      .collection("households")
      .where("mobileNumber", "==", phone)
      .limit(1)
      .get();
    const callerHouseholdId = householdSnap.empty ? null : householdSnap.docs[0].id;
    const isOwner = callerHouseholdId === app.householdId;

    if (!isOwner) {
      // Otherwise the caller must be authorized staff.
      const { role } = await resolveRole(request);
      if (!roleHasCapability(role, "application:review")) {
        throw new AuthError("Forbidden: not allowed to view this document.", 403);
      }
    }

    const [url] = await adminBucket.file(documents[index]).getSignedUrl({
      action: "read",
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return NextResponse.json(
      { url },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return errorResponse(error, "Application Document Access Error");
  }
}
