import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";
import { requireHousehold, errorResponse } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireHousehold(request);

    const [snapshot, votesSnapshot] = await Promise.all([
      adminDb.collection("polls").orderBy("createdAt", "desc").get(),
      adminDb.collection("votes").where("householdId", "==", user.householdId).get(),
    ]);

    const votedPollIds = new Set(votesSnapshot.docs.map((doc) => doc.data().pollId));

    const polls = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate().toISOString(),
        endDate: data.endDate?.toDate().toISOString(),
        createdAt: data.createdAt?.toDate().toISOString(),
        hasVoted: votedPollIds.has(doc.id),
      };
    });

    return NextResponse.json({ polls, userName: user.householdName });
  } catch (error) {
    return errorResponse(error, "Polls Fetch Error");
  }
}
