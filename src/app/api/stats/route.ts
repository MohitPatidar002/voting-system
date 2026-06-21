import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";
import { resolveRole, type Role } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    // Optional auth: the endpoint works for the public and adds admin-only
    // figures when a valid admin token is presented.
    let role: Role = "user";
    if (request.headers.get("authorization") || request.headers.get("Authorization")) {
      try {
        role = (await resolveRole(request)).role;
      } catch {
        role = "user";
      }
    }

    const stats: Record<string, number> = {};

    const now = new Date();
    const pollsQuery = await adminDb
      .collection("polls")
      .where("status", "==", "open")
      .get();
    stats.activePolls = pollsQuery.docs.filter((doc) => {
      const end = doc.data().endDate?.toDate();
      return end && end > now;
    }).length;

    if (role === "superadmin") {
      const modQuery = await adminDb
        .collection("complaints")
        .where("status", "==", "under_review")
        .count()
        .get();
      stats.pendingModeration = modQuery.data().count;
    }

    if (role === "superadmin" || role === "reviewer" || role === "admin") {
      const openQuery = await adminDb
        .collection("complaints")
        .where("status", "in", ["approved", "in_progress"])
        .count()
        .get();
      stats.openComplaints = openQuery.data().count;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
