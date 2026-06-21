import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";
import { requireHousehold, errorResponse } from "../../../lib/auth";

/** Returns the signed-in villager's own household profile. */
export async function GET(request: Request) {
  try {
    const user = await requireHousehold(request);
    const doc = await adminDb.collection("households").doc(user.householdId).get();
    const d = doc.data() || {};
    return NextResponse.json({
      name: user.householdName,
      mobileNumber: user.phone,
      address: d.address || "",
      registrationDate: d.registrationDate?.toDate?.().toISOString() ?? null,
    });
  } catch (error) {
    return errorResponse(error, "Me Fetch Error");
  }
}
