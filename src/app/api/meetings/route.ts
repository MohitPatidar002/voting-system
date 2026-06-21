import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";

/**
 * Public Gram Sabha meeting records — agenda, decisions, attendance and next
 * steps. Transparency feature, so readable without auth and CDN-cached.
 */
export async function GET() {
  try {
    const snapshot = await adminDb.collection("meetings").orderBy("date", "desc").get();
    const meetings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date?.toDate().toISOString() ?? null,
        status: data.status,
        agenda: data.agenda,
        decisions: data.decisions || "",
        attendanceCount: data.attendanceCount || 0,
        nextSteps: data.nextSteps || "",
      };
    });

    return NextResponse.json(
      { meetings },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Public Meetings Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
