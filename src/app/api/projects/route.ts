import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";

/**
 * Public development tracker. Everything here is meant to be transparent, so it
 * is readable without auth and CDN-cached. Shows allocated vs spent budget and
 * live progress for every panchayat work.
 */
export async function GET() {
  try {
    const snapshot = await adminDb.collection("projects").orderBy("createdAt", "desc").get();

    let totalAllocated = 0;
    let totalSpent = 0;
    const projects = snapshot.docs.map((doc) => {
      const data = doc.data();
      totalAllocated += Number(data.budgetAllocated) || 0;
      totalSpent += Number(data.budgetSpent) || 0;
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        description: data.description,
        contractor: data.contractor || "",
        budgetAllocated: Number(data.budgetAllocated) || 0,
        budgetSpent: Number(data.budgetSpent) || 0,
        fundingSource: data.fundingSource,
        status: data.status,
        progressPercent: Number(data.progressPercent) || 0,
        images: data.images || [],
        startDate: data.startDate?.toDate().toISOString() ?? null,
        expectedCompletion: data.expectedCompletion?.toDate?.().toISOString() ?? null,
      };
    });

    return NextResponse.json(
      { projects, summary: { totalAllocated, totalSpent, count: projects.length } },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180" } }
    );
  } catch (error) {
    console.error("Public Projects Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
