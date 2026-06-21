import { NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase/admin";
import { errorResponse } from "../../../../../lib/auth";
import { requireCapability } from "../../../../../lib/permissions";
import { SCHEME_CATALOGUE } from "../../../../../lib/gramPanchayatData";

/**
 * Seeds the `schemes` collection with the standard MP central + state welfare
 * schemes so a fresh village isn't staring at an empty screen. Idempotent:
 * schemes that already exist (matched by name) are skipped.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireCapability(request, "scheme:manage");

    const existingSnap = await adminDb.collection("schemes").get();
    const existingNames = new Set(existingSnap.docs.map((d) => d.data().name));

    const now = new Date();
    let added = 0;
    const batch = adminDb.batch();

    for (const tmpl of SCHEME_CATALOGUE) {
      if (existingNames.has(tmpl.name)) continue;
      const ref = adminDb.collection("schemes").doc();
      batch.set(ref, {
        ...tmpl,
        applicationStartDate: now,
        applicationEndDate: null, // ongoing by default; admin can set deadlines
        isActive: true,
        createdAt: now,
        createdBy: admin.uid,
      });
      added++;
    }

    if (added > 0) await batch.commit();
    return NextResponse.json({ success: true, added });
  } catch (error) {
    return errorResponse(error, "Scheme Seed Error");
  }
}
