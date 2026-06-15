import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const { mobileNumber } = await request.json();

    if (!mobileNumber || mobileNumber.length !== 10) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    const formattedNumber = `+91${mobileNumber}`;

    // Add to admins collection
    await adminDb.collection("admins").add({
      mobileNumber: formattedNumber,
      role: "superadmin"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
