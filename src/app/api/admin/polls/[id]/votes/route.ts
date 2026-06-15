import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  
  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  if (!decodedToken.phone_number) {
    throw new Error("Forbidden: No phone number associated with token");
  }
  const adminQuery = await adminDb.collection("admins").where("mobileNumber", "==", decodedToken.phone_number).get();
  if (adminQuery.empty) {
    throw new Error("Forbidden: Admin access required");
  }
  
  const adminDoc = adminQuery.docs[0];
  const adminData = adminDoc.data();
  if (adminData.role !== "superadmin") {
    throw new Error("Forbidden: Superadmin access required");
  }
  
  return decodedToken;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin(request);
    
    const resolvedParams = await params;
    const pollId = resolvedParams.id;

    // Fetch the poll
    const pollDoc = await adminDb.collection("polls").doc(pollId).get();
    if (!pollDoc.exists) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }
    const pollData = pollDoc.data()!;
    
    // Map options to text
    const optionMap: Record<string, string> = {};
    pollData.options.forEach((opt: any) => {
      optionMap[opt.id] = opt.text;
    });

    // Fetch votes for this poll
    const votesSnapshot = await adminDb.collection("votes")
      .where("pollId", "==", pollId)
      .get();

    if (votesSnapshot.empty) {
      return NextResponse.json({ 
        poll: { title: pollData.title, description: pollData.description },
        votes: [] 
      });
    }

    let voteRecords = votesSnapshot.docs.map(doc => doc.data());
    
    // Sort in memory to avoid Firebase composite index requirement
    voteRecords.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA; // desc
    });
    
    // Fetch all households to join with votes
    const householdsSnapshot = await adminDb.collection("households").get();
    const householdsMap: Record<string, any> = {};
    householdsSnapshot.docs.forEach(doc => {
      householdsMap[doc.id] = doc.data();
    });

    // Join data
    const detailedVotes = voteRecords.map(vote => {
      const household = householdsMap[vote.householdId] || {};
      
      let optionSelectedText = "Unknown Option";
      if (vote.optionIds && Array.isArray(vote.optionIds)) {
        optionSelectedText = vote.optionIds.map((id: string) => optionMap[id] || "Unknown").join(", ");
      } else if (vote.optionId) {
        optionSelectedText = optionMap[vote.optionId] || "Unknown Option";
      }

      return {
        id: vote.householdId, // We use householdId as the unique key for the row
        representativeName: household.representativeName || "Unknown",
        mobileNumber: household.mobileNumber || "Unknown",
        address: household.address || "Unknown",
        optionSelected: optionSelectedText,
        timestamp: vote.createdAt ? vote.createdAt.toDate().toISOString() : null
      };
    });

    return NextResponse.json({
      poll: { title: pollData.title, description: pollData.description },
      votes: detailedVotes
    });

  } catch (error: any) {
    console.error("Detailed Votes API Error:", error);
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
