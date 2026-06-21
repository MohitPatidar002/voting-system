import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";
import { requireHousehold, errorResponse } from "../../../lib/auth";

/**
 * Returns ONLY the calling household's own scheme applications. A villager can
 * never see another household's applications or documents through this route.
 */
export async function GET(request: Request) {
  try {
    const user = await requireHousehold(request);

    const snapshot = await adminDb
      .collection("applications")
      .where("householdId", "==", user.householdId)
      .get();

    const applications = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          schemeId: data.schemeId,
          schemeName: data.schemeName,
          status: data.status,
          reviewerNote: data.reviewerNote || "",
          documentCount: Array.isArray(data.documents) ? data.documents.length : 0,
          createdAt: data.createdAt?.toDate().toISOString() ?? null,
          updatedAt: data.updatedAt?.toDate().toISOString() ?? null,
        };
      })
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({ applications });
  } catch (error) {
    return errorResponse(error, "Applications Fetch Error");
  }
}
