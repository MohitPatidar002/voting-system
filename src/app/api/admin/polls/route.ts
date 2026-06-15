import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase/admin";
import { Poll } from "../../../../types";

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

export async function POST(request: Request) {
  try {
    const adminToken = await verifyAdmin(request);
    const body = await request.json();
    
    // Validation
    const { title, description, startDate, endDate, type, options, allowMultiple } = body;
    if (!title || !description || !startDate || !endDate || !type || !options || options.length < 2) {
      return NextResponse.json({ error: "Missing required fields or insufficient options" }, { status: 400 });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    
    if (end <= start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }
    
    // Ensure the slot is valid (e.g., at least 30 mins)
    const durationMins = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMins < 30) {
      return NextResponse.json({ error: "Poll must be open for at least 30 minutes" }, { status: 400 });
    }

    const newPoll: Omit<Poll, 'id'> = {
      title,
      description,
      startDate: start,
      endDate: end,
      status: 'draft',
      type,
      options,
      allowMultiple: !!allowMultiple,
      totalVotes: 0,
      results: {},
      createdAt: new Date(),
      createdBy: adminToken.uid,
    };

    const docRef = await adminDb.collection("polls").add(newPoll);
    
    return NextResponse.json({ success: true, pollId: docRef.id });

  } catch (error: any) {
    console.error("Poll Creation Error:", error);
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);
    const snapshot = await adminDb.collection("polls").orderBy("createdAt", "desc").get();
    
    const polls = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        allowMultiple: data.allowMultiple || false,
        startDate: data.startDate?.toDate().toISOString(),
        endDate: data.endDate?.toDate().toISOString(),
        createdAt: data.createdAt?.toDate().toISOString(),
      };
    });

    return NextResponse.json({ polls });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
