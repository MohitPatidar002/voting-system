import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { requireHousehold, errorResponse } from "../../../../lib/auth";

/**
 * A villager's own complaints, whatever their moderation state. The public
 * feed only shows approved items, so without this route a complaint would
 * disappear into moderation with no way for the reporter to follow it. Only
 * the filing household can see these — identity never crosses households.
 */
export async function GET(request: Request) {
  try {
    const user = await requireHousehold(request);

    // No orderBy: filtering by householdId alone avoids a composite index;
    // a single household's complaints are few, so we sort in memory.
    const snapshot = await adminDb
      .collection("complaints")
      .where("householdId", "==", user.householdId)
      .limit(100)
      .get();

    const complaints = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          images: data.images || [],
          status: data.status,
          adminResponse: data.adminResponse || "",
          createdAt: data.createdAt?.toDate().toISOString() ?? null,
          updatedAt: data.updatedAt?.toDate().toISOString() ?? null,
        };
      })
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({ complaints });
  } catch (error) {
    return errorResponse(error, "My Complaints Fetch Error");
  }
}
