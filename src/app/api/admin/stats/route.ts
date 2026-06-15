import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase/admin";

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
  
  return decodedToken;
}

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);

    // Get Households count
    const householdsSnapshot = await adminDb.collection("households").count().get();
    const householdsCount = householdsSnapshot.data().count;

    // Get Notices count
    const noticesSnapshot = await adminDb.collection("notices").count().get();
    const noticesCount = noticesSnapshot.data().count;

    // Get Polls and calculate active vs closed
    const pollsSnapshot = await adminDb.collection("polls").get();
    const totalPolls = pollsSnapshot.size;
    
    let activePollsCount = 0;
    let closedPollsCount = 0;
    
    const now = new Date();

    pollsSnapshot.forEach(doc => {
      const data = doc.data();
      const start = data.startDate?.toDate();
      const end = data.endDate?.toDate();
      
      if (start && end) {
        if (now >= start && now <= end) {
          activePollsCount++;
        } else if (now > end) {
          closedPollsCount++;
        }
      }
    });

    return NextResponse.json({
      households: householdsCount,
      totalPolls,
      activePolls: activePollsCount,
      closedPolls: closedPollsCount,
      notices: noticesCount
    });

  } catch (error: any) {
    console.error("Stats API Error:", error);
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
