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
      if (start && end) {
        if (now >= start && now <= end) activePolls++;
        else if (now > end) closedPolls++;
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
