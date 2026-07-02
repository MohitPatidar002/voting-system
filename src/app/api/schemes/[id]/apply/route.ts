import { NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase/admin";
import { requireHousehold, errorResponse, AuthError } from "../../../../../lib/auth";
import { enforceRateLimit } from "../../../../../lib/rateLimit";
import { cleanText } from "../../../../../lib/validate";

/**
 * A villager applies to a scheme through the platform.
 *
 * Privacy: documents are stored as PRIVATE storage paths under the applicant's
 * own uid folder (`applications/{uid}/...`). We reject any path that is not the
 * caller's own folder, so one villager can never attach — or later reach —
 * another villager's documents. Public URLs are never stored.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireHousehold(request);
    const { id: schemeId } = await params;

    await enforceRateLimit("apply", user.householdId, 20, 3600);

    const body = await request.json();
    const notes = body.notes
      ? cleanText(body.notes, "Notes", { min: 0, max: 1000 })
      : "";

    // Validate document paths belong to THIS user's private folder.
    const prefix = `applications/${user.uid}/`;
    const documents: string[] = Array.isArray(body.documents)
      ? body.documents.slice(0, 15)
      : [];
    for (const path of documents) {
      if (typeof path !== "string" || !path.startsWith(prefix) || path.length > 500) {
        throw new AuthError("Invalid document reference.", 400);
      }
    }

    const schemeSnap = await adminDb.collection("schemes").doc(schemeId).get();
    if (!schemeSnap.exists) {
      return NextResponse.json({ error: "Scheme not found." }, { status: 404 });
    }
    const scheme = schemeSnap.data()!;
    if (!scheme.isActive || !scheme.acceptsInAppApplication) {
      return NextResponse.json(
        { error: "This scheme is not accepting applications here." },
        { status: 409 }
      );
    }
    const end = scheme.applicationEndDate?.toDate?.() ?? null;
    if (end && end.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "The application window for this scheme has closed." },
        { status: 409 }
      );
    }

    // One LIVE application per household per scheme (deterministic id). A
    // rejected application may be replaced by a fresh submission — a family
    // whose papers were incomplete once shouldn't be locked out forever.
    const appId = `${schemeId}_${user.householdId}`;
    const appRef = adminDb.collection("applications").doc(appId);
    const existing = await appRef.get();
    const isResubmission = existing.exists && existing.data()?.status === "rejected";
    if (existing.exists && !isResubmission) {
      return NextResponse.json(
        { error: "You have already applied to this scheme." },
        { status: 409 }
      );
    }

    const now = new Date();
    await appRef.set({
      schemeId,
      schemeName: scheme.name,
      householdId: user.householdId,
      applicantName: user.householdName,
      mobileNumber: user.phone,
      notes,
      documents,
      status: "submitted",
      // Keep the previous decision visible to the reviewer on resubmission.
      reviewerNote: isResubmission
        ? `[Resubmitted] Previous note: ${existing.data()?.reviewerNote || "—"}`
        : "",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, applicationId: appId });
  } catch (error) {
    return errorResponse(error, "Scheme Application Error");
  }
}
