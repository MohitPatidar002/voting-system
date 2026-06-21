import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebase/admin";

export type Role = "user" | "reviewer" | "admin" | "superadmin";

/** Roles that live in the `admins` collection (everything except plain villagers). */
export const ADMIN_ROLES: Role[] = ["reviewer", "admin", "superadmin"];

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export interface DecodedUser {
  uid: string;
  phone: string;
}

export interface AdminUser extends DecodedUser {
  role: Role;
}

export interface HouseholdUser extends DecodedUser {
  householdId: string;
  householdName: string;
}

function extractBearer(request: Request): string {
  const header =
    request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new AuthError("Unauthorized", 401);
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new AuthError("Unauthorized", 401);
  return token;
}

/**
 * Verifies the Firebase ID token and requires a phone-authenticated user.
 * Cost: 1 token verification, 0 Firestore reads.
 */
export async function verifyToken(request: Request): Promise<DecodedUser> {
  const token = extractBearer(request);
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    throw new AuthError("Unauthorized", 401);
  }
  if (!decoded.phone_number) {
    throw new AuthError("Forbidden: phone authentication required", 403);
  }
  return { uid: decoded.uid, phone: decoded.phone_number };
}

/**
 * Resolves the caller's role. Fast path reads the role from a Firebase custom
 * claim (0 Firestore reads). On a cache miss it falls back to the `admins`
 * collection (1 read) and lazily provisions the claim for subsequent requests.
 */
export async function resolveRole(request: Request): Promise<AdminUser> {
  const token = extractBearer(request);
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    throw new AuthError("Unauthorized", 401);
  }
  if (!decoded.phone_number) {
    throw new AuthError("Forbidden: phone authentication required", 403);
  }

  // Fast path: role baked into the token via custom claims.
  const claimRole = (decoded as Record<string, unknown>).role as Role | undefined;
  if (claimRole && ADMIN_ROLES.includes(claimRole)) {
    return { uid: decoded.uid, phone: decoded.phone_number, role: claimRole };
  }

  // Slow path: look up the admins collection and provision the claim.
  const snap = await adminDb
    .collection("admins")
    .where("mobileNumber", "==", decoded.phone_number)
    .limit(1)
    .get();

  if (snap.empty) {
    return { uid: decoded.uid, phone: decoded.phone_number, role: "user" };
  }

  const role = ((snap.docs[0].data().role as Role) || "admin") as Role;
  // Best-effort: cache the role on the token for next time.
  try {
    await adminAuth.setCustomUserClaims(decoded.uid, { role });
  } catch {
    /* non-fatal */
  }
  return { uid: decoded.uid, phone: decoded.phone_number, role };
}

/** Requires the caller to hold one of the allowed admin-tier roles. */
export async function requireRole(
  request: Request,
  allowed: Role[]
): Promise<AdminUser> {
  const user = await resolveRole(request);
  if (!allowed.includes(user.role)) {
    throw new AuthError("Forbidden: insufficient permissions", 403);
  }
  return user;
}

/**
 * Requires the caller to be an active household (villager). Returns the
 * household id without any admin lookup. Cost: 1 token verify + 1 read.
 */
export async function requireHousehold(
  request: Request
): Promise<HouseholdUser> {
  const { uid, phone } = await verifyToken(request);
  const snap = await adminDb
    .collection("households")
    .where("mobileNumber", "==", phone)
    .where("isActive", "==", true)
    .limit(1)
    .get();
  if (snap.empty) {
    throw new AuthError("Forbidden: Account inactive or not found", 403);
  }
  const doc = snap.docs[0];
  return {
    uid,
    phone,
    householdId: doc.id,
    householdName: doc.data().representativeName || "Unknown",
  };
}

/** Maps any thrown error to a safe JSON response (never leaks internals). */
export function errorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(`${context}:`, error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
