import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { enforceRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    // Throttle per IP to prevent number-enumeration and OTP-cost abuse.
    await enforceRateLimit("verify-number", getClientIp(request), 10, 600);

    const { phoneNumber } = await request.json();
    if (typeof phoneNumber !== "string" || !/^\+91[0-9]{10}$/.test(phoneNumber)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const [adminsSnapshot, householdsSnapshot] = await Promise.all([
      adminDb.collection("admins").where("mobileNumber", "==", phoneNumber).limit(1).get(),
      adminDb.collection("households").where("mobileNumber", "==", phoneNumber).limit(1).get(),
    ]);

    // Deliberately role-blind: this endpoint answers ONLY "may this number
    // receive an OTP?". Revealing which numbers are staff accounts to an
    // unauthenticated caller would hand attackers a target list. The client
    // decides where to land AFTER the OTP proves ownership of the number.
    if (!adminsSnapshot.empty) {
      return NextResponse.json({ exists: true });
    }

    if (!householdsSnapshot.empty) {
      if (!householdsSnapshot.docs[0].data().isActive) {
        return NextResponse.json(
          { error: "Your household account is deactivated. Contact Panchayat." },
          { status: 403 }
        );
      }
      return NextResponse.json({ exists: true });
    }

    return NextResponse.json({ error: "Number not registered" }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Too many requests")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("Error verifying number:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
