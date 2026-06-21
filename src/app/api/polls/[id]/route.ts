import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { requireHousehold, errorResponse } from "../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireHousehold(request);
    const { id } = await params;

    const docRef = await adminDb.collection("polls").doc(id).get();
    if (!docRef.exists) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const data = docRef.data()!;

    const voteRef = await adminDb
      .collection("votes")
      .doc(`${id}_${user.householdId}`)
      .get();
    const hasVoted = voteRef.exists;
    const voteData = voteRef.data();

    let userVotes: string[] = [];
    if (hasVoted && voteData) {
      if (voteData.optionIds) userVotes = voteData.optionIds;
      else if (voteData.optionId) userVotes = [voteData.optionId];
    }

    const poll = {
      id: docRef.id,
      ...data,
      startDate: data.startDate?.toDate().toISOString(),
      endDate: data.endDate?.toDate().toISOString(),
      createdAt: data.createdAt?.toDate().toISOString(),
    };

    return NextResponse.json({ poll, hasVoted, userVotes });
  } catch (error) {
    return errorResponse(error, "Poll Fetch Error");
  }
}
