import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { requireHousehold, errorResponse, AuthError } from "../../../../lib/auth";

/**
 * Stores a villager's FCM web-push token so the Panchayat can alert them about
 * new schemes/notices even when the app is closed. Keyed by the token itself so
 * the same device re-subscribing is idempotent.
 */
export async function POST(request: Request) {
  try {
    const user = await requireHousehold(request);
    const { token } = await request.json();
    if (typeof token !== "string" || token.length < 20 || token.length > 4096) {
      throw new AuthError("Invalid token.", 400);
    }

    await adminDb.collection("push_tokens").doc(token).set({
      token,
      householdId: user.householdId,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Push Subscribe Error");
  }
}
