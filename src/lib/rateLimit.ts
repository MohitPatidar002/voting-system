import { adminDb } from "./firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { AuthError } from "./auth";

/**
 * Fixed-window rate limiter backed by Firestore. A single transaction reads and
 * increments a per-bucket counter, so it works across serverless instances
 * (unlike an in-memory map). Buckets are time-sliced via their document id and
 * carry an `expireAt` field so a Firestore TTL policy can reap stale docs.
 *
 * Returns silently when allowed; throws AuthError(429) when the limit is hit.
 */
export async function enforceRateLimit(
  scope: string,
  identifier: string,
  max: number,
  windowSeconds: number
): Promise<void> {
  if (!identifier) identifier = "unknown";
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowIndex = Math.floor(now / windowMs);
  // Sanitize identifier so it is a safe Firestore document id.
  const safeId = identifier.replace(/[^a-zA-Z0-9_.+-]/g, "_").slice(0, 200);
  const docId = `${scope}__${safeId}__${windowIndex}`;
  const ref = adminDb.collection("rate_limits").doc(docId);

  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = snap.exists ? (snap.data()?.count as number) || 0 : 0;
      if (count >= max) {
        throw new AuthError("Too many requests. Please try again later.", 429);
      }
      tx.set(
        ref,
        {
          count: FieldValue.increment(1),
          expireAt: new Date(now + windowMs),
        },
        { merge: true }
      );
    });
  } catch (err) {
    if (err instanceof AuthError) throw err;
    // If the limiter backend fails, fail open rather than block legitimate users.
    console.error("Rate limiter error:", err);
  }
}

/** Best-effort client IP from common proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
