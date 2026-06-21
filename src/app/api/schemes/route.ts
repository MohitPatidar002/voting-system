import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";

/**
 * Public list of active government schemes. Non-sensitive information, so it is
 * readable without authentication and CDN-cached to keep the village dashboard
 * fast on free hosting. Expired schemes (past their application end date) are
 * filtered out so villagers only see what they can still act on.
 */
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("schemes")
      .where("isActive", "==", true)
      .get();

    const now = Date.now();
    const schemes = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const end = data.applicationEndDate?.toDate?.() ?? null;
        return {
          id: doc.id,
          name: data.name,
          nameHi: data.nameHi || "",
          department: data.department || "",
          category: data.category,
          description: data.description,
          benefits: data.benefits,
          eligibility: data.eligibility,
          requiredDocuments: data.requiredDocuments || [],
          externalUrl: data.externalUrl || "",
          acceptsInAppApplication: !!data.acceptsInAppApplication,
          applicationEndDate: end ? end.toISOString() : null,
          isOpen: !end || end.getTime() >= now,
        };
      })
      .filter((s) => s.isOpen)
      .sort((a, b) => {
        // Deadlines first (soonest), then ongoing schemes.
        if (a.applicationEndDate && b.applicationEndDate)
          return a.applicationEndDate.localeCompare(b.applicationEndDate);
        if (a.applicationEndDate) return -1;
        if (b.applicationEndDate) return 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json(
      { schemes },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Public Schemes Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
