import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firebase/admin";

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

  // Also grab the household ID for convenience
  const households = await adminDb.collection("households")
    .where("mobileNumber", "==", decodedToken.phone_number)
    .where("isActive", "==", true)
    .get();

  if (households.empty) {
    throw new Error("Forbidden: Account inactive or not found");
  }

  return { 
    uid: decodedToken.uid, 
    phone: decodedToken.phone_number, 
    householdId: households.docs[0].id,
    userName: households.docs[0].data().representativeName
  };
}

  export async function GET(request: Request) {
    try {
      const user = await verifyUser(request);
      
      // Fetch polls (order by newest first)
      const snapshot = await adminDb.collection("polls").orderBy("createdAt", "desc").get();
      
      // Fetch votes for the current household to know which polls they've voted on
      const votesSnapshot = await adminDb.collection("votes").where("householdId", "==", user.householdId).get();
      const votedPollIds = new Set(votesSnapshot.docs.map(doc => doc.data().pollId));

      const polls = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate().toISOString(),
          endDate: data.endDate?.toDate().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString(),
          hasVoted: votedPollIds.has(doc.id)
        };
      });
  
      return NextResponse.json({ polls, userName: user.userName });
  } catch (error: any) {
    if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
