import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase/admin";

async function verifyUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  const households = await adminDb.collection("households")
    .where("mobileNumber", "==", decodedToken.phone_number)
    .where("isActive", "==", true)
    .get();

  if (households.empty) {
    throw new Error("Forbidden: Account inactive or not found");
  }

  return { uid: decodedToken.uid, householdId: households.docs[0].id };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyUser(request);
    
    const resolvedParams = await params;
    const docRef = await adminDb.collection("polls").doc(resolvedParams.id).get();
    if (!docRef.exists) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const data = docRef.data()!;
    
    // Check if user has already voted
    const voteRef = await adminDb.collection("votes").doc(`${resolvedParams.id}_${user.householdId}`).get();
    const hasVoted = voteRef.exists;
    const voteData = voteRef.data();
    
    // Support legacy single optionId and new multiple optionIds
    let userVotes: string[] = [];
    if (hasVoted && voteData) {
      if (voteData.optionIds) {
        userVotes = voteData.optionIds;
      } else if (voteData.optionId) {
        userVotes = [voteData.optionId];
      }
    }

    const poll = {
      id: docRef.id,
      ...data,
      startDate: data.startDate?.toDate().toISOString(),
      endDate: data.endDate?.toDate().toISOString(),
      createdAt: data.createdAt?.toDate().toISOString(),
    };

    return NextResponse.json({ poll, hasVoted, userVotes });
  } catch (error: any) {
    if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
