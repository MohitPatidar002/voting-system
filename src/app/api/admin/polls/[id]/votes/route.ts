import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { errorResponse } from "@/lib/auth";
import { requireCapability } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Seeing who voted is a superadmin-only capability.
    await requireCapability(request, "poll:viewVoters");
    const { id: pollId } = await params;

    const pollDoc = await adminDb.collection("polls").doc(pollId).get();
    if (!pollDoc.exists) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }
    const pollData = pollDoc.data()!;

    const optionMap: Record<string, string> = {};
    pollData.options.forEach((opt: { id: string; text: string }) => {
      optionMap[opt.id] = opt.text;
    });

    const votesSnapshot = await adminDb
      .collection("votes")
      .where("pollId", "==", pollId)
      .get();

    if (votesSnapshot.empty) {
      return NextResponse.json({
        poll: { title: pollData.title, description: pollData.description },
        votes: [],
      });
    }

    const voteRecords = votesSnapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => {
        const ta = a.createdAt ? a.createdAt.toDate().getTime() : 0;
        const tb = b.createdAt ? b.createdAt.toDate().getTime() : 0;
        return tb - ta;
      });

    // Resolve only the households that actually voted (not the whole collection).
    const householdIds = [
      ...new Set(
        voteRecords.map((v) => v.householdId).filter((id): id is string => !!id)
      ),
    ];
    const householdsMap: Record<string, FirebaseFirestore.DocumentData> = {};
    if (householdIds.length > 0) {
      const refs = householdIds.map((id) => adminDb.collection("households").doc(id));
      const docs = await adminDb.getAll(...refs);
      docs.forEach((d) => {
        if (d.exists) householdsMap[d.id] = d.data()!;
      });
    }

    const detailedVotes = voteRecords.map((vote) => {
      const household = householdsMap[vote.householdId] || {};
      let optionSelectedText = "Unknown Option";
      if (Array.isArray(vote.optionIds)) {
        optionSelectedText = vote.optionIds
          .map((id: string) => optionMap[id] || "Unknown")
          .join(", ");
      } else if (vote.optionId) {
        optionSelectedText = optionMap[vote.optionId] || "Unknown Option";
      }
      return {
        id: vote.householdId,
        representativeName: household.representativeName || "Unknown",
        mobileNumber: household.mobileNumber || "Unknown",
        address: household.address || "Unknown",
        optionSelected: optionSelectedText,
        timestamp: vote.createdAt ? vote.createdAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json({
      poll: { title: pollData.title, description: pollData.description },
      votes: detailedVotes,
    });
  } catch (error) {
    return errorResponse(error, "Detailed Votes API Error");
  }
}
