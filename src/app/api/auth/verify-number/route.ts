import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Check in admins collection
    const adminsSnapshot = await adminDb.collection("admins").where("mobileNumber", "==", phoneNumber).get();
    if (!adminsSnapshot.empty) {
      return NextResponse.json({ exists: true, role: "admin" });
    }

    // Check in households collection
    const householdsSnapshot = await adminDb.collection("households").where("mobileNumber", "==", phoneNumber).get();
    if (!householdsSnapshot.empty) {
      const doc = householdsSnapshot.docs[0];
      if (!doc.data().isActive) {
         return NextResponse.json({ error: "Your household account is deactivated. Contact Panchayat." }, { status: 403 });
      }
      return NextResponse.json({ exists: true, role: "user" });
    }

    return NextResponse.json({ error: "Number not registered" }, { status: 404 });

  } catch (error) {
    console.error("Error verifying number:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
