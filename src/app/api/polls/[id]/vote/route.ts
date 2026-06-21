import { NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireHousehold, errorResponse, AuthError } from "../../../../../lib/auth";
import { enforceRateLimit } from "../../../../../lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireHousehold(request);
    const { id: pollId } = await params;
    const { optionIds } = await request.json();

    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json(
        { error: "At least one option must be selected." },
        { status: 400 }
      );
    }

    // Light throttle on vote attempts per household.
    await enforceRateLimit("vote", user.householdId, 30, 3600);

    const pollRef = adminDb.collection("polls").doc(pollId);
    const voteRef = adminDb.collection("votes").doc(`${pollId}_${user.householdId}`);

    await adminDb.runTransaction(async (transaction) => {
      const pollDoc = await transaction.get(pollRef);
      if (!pollDoc.exists) throw new AuthError("Poll not found.", 404);

      const pollData = pollDoc.data()!;
      const now = new Date();
      const start = pollData.startDate.toDate();
      const end = pollData.endDate.toDate();

      // A poll is votable ONLY when it is explicitly open AND inside its window.
      const isVotable = pollData.status === "open" && now >= start && now <= end;
      if (!isVotable) {
        throw new AuthError("Voting is closed or not yet open for this poll.", 400);
      }

      if (!pollData.allowMultiple && optionIds.length > 1) {
        throw new AuthError("This poll does not allow multiple selections.", 400);
      }

      const validIds = new Set(pollData.options.map((opt: { id: string }) => opt.id));
      if (optionIds.some((id: string) => !validIds.has(id))) {
        throw new AuthError("Invalid voting option provided.", 400);
      }

      const voteDoc = await transaction.get(voteRef);
      if (voteDoc.exists) {
        throw new AuthError("Your household has already voted on this poll.", 409);
      }

      transaction.set(voteRef, {
        pollId,
        householdId: user.householdId,
        optionIds,
        createdAt: FieldValue.serverTimestamp(),
      });

      const updates: Record<string, FieldValue> = {
        totalVotes: FieldValue.increment(1),
      };
      optionIds.forEach((id: string) => {
        updates[`results.${id}`] = FieldValue.increment(1);
      });
      transaction.update(pollRef, updates);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Voting Error");
  }
}
