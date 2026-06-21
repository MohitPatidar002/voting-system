import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { adminDb } from "../../../lib/firebase/admin";
import { enforceRateLimit, getClientIp } from "../../../lib/rateLimit";

/**
 * One-time bootstrap to create the very first superadmin.
 *
 * Hardened against takeover:
 *   1. Requires a secret (SETUP_SECRET) sent in the `x-setup-secret` header,
 *      compared in constant time.
 *   2. Refuses once any superadmin already exists, so it cannot be replayed.
 *   3. Rate-limited per IP.
 * If SETUP_SECRET is not configured, the endpoint is disabled entirely.
 */
function constantTimeEquals(a: string, b: string): boolean {
  // Hash both sides to equal-length buffers so length never leaks and
  // timingSafeEqual won't throw on mismatched sizes.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.SETUP_SECRET;
    if (!expectedSecret) {
      return NextResponse.json({ error: "Setup is disabled." }, { status: 403 });
    }

    await enforceRateLimit("setup", getClientIp(request), 5, 3600);

    const providedSecret = request.headers.get("x-setup-secret") || "";
    if (!constantTimeEquals(providedSecret, expectedSecret)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Refuse if a superadmin already exists — makes this strictly one-time.
    const existing = await adminDb
      .collection("admins")
      .where("role", "==", "superadmin")
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "Setup has already been completed." },
        { status: 409 }
      );
    }

    const { mobileNumber } = await request.json();
    if (typeof mobileNumber !== "string" || !/^[0-9]{10}$/.test(mobileNumber)) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    const formattedNumber = `+91${mobileNumber}`;
    await adminDb.collection("admins").add({
      mobileNumber: formattedNumber,
      role: "superadmin",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Too many requests")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("Setup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
