import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase/admin";
import { Notice } from "../../../../types";

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
    const { title, content, type } = body;

    if (!title || !content || !type) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const newNotice: Omit<Notice, 'id'> = {
      title,
      content,
      type,
      createdAt: new Date(),
      createdBy: adminToken.uid,
      isActive: true,
    };

    const docRef = await adminDb.collection("notices").add(newNotice);
    return NextResponse.json({ success: true, noticeId: docRef.id });

  } catch (error: any) {
    console.error("Notice Creation Error:", error);
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
