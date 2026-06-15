import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

async function verifyUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  if (!decodedToken.phone_number) {
    throw new Error("Forbidden: Valid phone authentication required");
  }

  const households = await adminDb.collection("households")
    .where("mobileNumber", "==", decodedToken.phone_number)
    .where("isActive", "==", true)
    .get();

  if (households.empty) {
    throw new Error("Forbidden: Account inactive or not found");
  }

  return { uid: decodedToken.uid, phone: decodedToken.phone_number, householdId: households.docs[0].id };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyUser(request);
    const resolvedParams = await params;
    const pollId = resolvedParams.id;
    const { optionIds } = await request.json();

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json({ error: "At least one option must be selected." }, { status: 400 });
    }

    const pollRef = adminDb.collection("polls").doc(pollId);
    const voteRef = adminDb.collection("votes").doc(`${pollId}_${user.householdId}`);

    // Run transaction to ensure atomicity
    await adminDb.runTransaction(async (transaction) => {
      const pollDoc = await transaction.get(pollRef);
      if (!pollDoc.exists) {
        throw new Error("Poll not found.");
      }

      const pollData = pollDoc.data()!;
      
      // Validation: Check if poll is open
      const now = new Date();
      const start = pollData.startDate.toDate();
      const end = pollData.endDate.toDate();
      
      if (pollData.status !== "open" && (now < start || now > end)) {
        throw new Error("Voting is closed or not yet open for this poll.");
      }

      if (!pollData.allowMultiple && optionIds.length > 1) {
        throw new Error("This poll does not allow multiple selections.");
      }

      // Validation: Check if valid options
      const invalidOption = optionIds.some(id => !pollData.options.some((opt: any) => opt.id === id));
      if (invalidOption) {
        throw new Error("Invalid voting option provided.");
      }

      // Validation: Check if already voted
      const voteDoc = await transaction.get(voteRef);
      if (voteDoc.exists) {
        throw new Error("Your household has already voted on this poll.");
      }

      // Create vote record
      transaction.set(voteRef, {
        pollId,
        householdId: user.householdId,
        optionIds,
        createdAt: FieldValue.serverTimestamp()
      });

      // Update aggregate results on the poll document
      const currentResults = pollData.results || {};
      
      const updates: any = {
        totalVotes: FieldValue.increment(1)
      };

      optionIds.forEach(id => {
        const currentCount = currentResults[id] || 0;
        updates[`results.${id}`] = currentCount + 1;
      });
      
      transaction.update(pollRef, updates);
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Voting Error:", error);
    if (error.message.includes("already voted") || error.message.includes("closed")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
