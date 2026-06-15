import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken.phone_number) {
      return NextResponse.json({ error: "Forbidden: No phone number associated with token" }, { status: 403 });
    }

    const adminQuery = await adminDb.collection("admins").where("mobileNumber", "==", decodedToken.phone_number).get();
    
    if (adminQuery.empty) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const adminDoc = adminQuery.docs[0];
    const adminData = adminDoc.data();
    
    // Default to 'admin' if role field is missing
    const role = adminData.role || "admin";

    return NextResponse.json({ 
      role, 
      mobileNumber: adminData.mobileNumber,
      uid: decodedToken.uid 
    });

  } catch (error: any) {
    console.error("Admin Me API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
