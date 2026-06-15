import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firebase/admin";

async function verifyUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split("Bearer ")[1];
  await adminAuth.verifyIdToken(token);
}

export async function GET(request: Request) {
  try {
    await verifyUser(request);
    
    // Fetch active notices
    const snapshot = await adminDb.collection("notices")
      .where("isActive", "==", true)
      .orderBy("createdAt", "desc")
      .get();
    
    const notices = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
      };
    });

    return NextResponse.json({ notices });
  } catch (error: any) {
    if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
