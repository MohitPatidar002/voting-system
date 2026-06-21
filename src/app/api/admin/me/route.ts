import { NextResponse } from "next/server";
import { errorResponse } from "../../../../lib/auth";
import { requireAnyAdmin } from "../../../../lib/permissions";
import { ROLE_CAPABILITIES } from "../../../../lib/permissions";

export async function GET(request: Request) {
  try {
    const admin = await requireAnyAdmin(request);
    return NextResponse.json({
      role: admin.role,
      mobileNumber: admin.phone,
      uid: admin.uid,
      capabilities: ROLE_CAPABILITIES[admin.role],
    });
  } catch (error) {
    return errorResponse(error, "Admin Me API Error");
  }
}
