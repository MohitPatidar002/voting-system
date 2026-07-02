import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";
import { requireHousehold, errorResponse } from "../../../lib/auth";
import { serializePollForVillager } from "../../../lib/pollSerializer";

const PUBLIC_POLL_STATUSES = ["open", "closed"];

export async function GET(request: Request) {
  try {
    const user = await requireHousehold(request);

    // Villagers only ever see published polls — drafts stay admin-only.
    const [snapshot, votesSnapshot] = await Promise.all([
      adminDb
        .collection("polls")
        .where("status", "in", PUBLIC_POLL_STATUSES)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get(),
      adminDb.collection("votes").where("householdId", "==", user.householdId).get(),
    ]);

    const votedPollIds = new Set(votesSnapshot.docs.map((doc) => doc.data().pollId));

    const polls = snapshot.docs.map((doc) =>
      serializePollForVillager(doc.id, doc.data(), votedPollIds.has(doc.id))
    );

    return NextResponse.json({ polls, userName: user.householdName });
  } catch (error) {
    return errorResponse(error, "Polls Fetch Error");
  }
}
