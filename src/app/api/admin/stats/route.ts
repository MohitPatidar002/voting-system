import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireAnyAdmin } from "../../../../lib/permissions";

export async function GET(request: Request) {
  try {
    await requireAnyAdmin(request);

    const now = new Date();
    const [householdsCount, noticesCount, pollsSnapshot] = await Promise.all([
      adminDb.collection("households").count().get(),
      adminDb.collection("notices").count().get(),
      adminDb.collection("polls").get(),
    ]);

    let activePolls = 0;
    let closedPolls = 0;
    pollsSnapshot.forEach((doc) => {
      const data = doc.data();
      const start = data.startDate?.toDate();
      const end = data.endDate?.toDate();
      // "Active" mirrors the vote route's votability rule: explicitly open AND
      // inside the window. Drafts are neither active nor closed.
      if (data.status === "open" && start && end && now >= start && now <= end) {
        activePolls++;
      } else if (data.status === "closed" || (data.status === "open" && end && now > end)) {
        closedPolls++;
      }
    });

    return NextResponse.json({
      households: householdsCount.data().count,
      totalPolls: pollsSnapshot.size,
      activePolls,
      closedPolls,
      notices: noticesCount.data().count,
    });
  } catch (error) {
    return errorResponse(error, "Admin Stats Error");
  }
}
