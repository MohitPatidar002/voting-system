import { resolveRole, AuthError, type Role, type AdminUser } from "./auth";

/**
 * Capability-based access control.
 *
 * Roles never carry hard-coded checks scattered across routes. Instead each
 * route asks for a *capability*, and this single matrix decides which roles
 * hold it. To change who can do what, edit ROLE_CAPABILITIES here — nowhere
 * else. This is the one place a permission "loophole" could hide, so it is
 * deliberately small and explicit.
 */
export type Capability =
  // Villager registry
  | "household:manage"
  // Polls
  | "poll:create"
  | "poll:viewVoters"
  // Notices & broadcasts
  | "notice:create"
  // Complaints
  | "complaint:moderate" // approve/reject what becomes public + see identity
  | "complaint:updateProgress" // move status forward, post official response
  // Government schemes (Yojana)
  | "scheme:manage"
  | "application:review" // read villager applications + their documents
  // Development tracker
  | "project:manage"
  // Budget transparency
  | "budget:manage"
  // Village directory of officials
  | "directory:manage"
  // Gram Sabha meeting records
  | "meeting:manage";

const ALL_CAPABILITIES: Capability[] = [
  "household:manage",
  "poll:create",
  "poll:viewVoters",
  "notice:create",
  "complaint:moderate",
  "complaint:updateProgress",
  "scheme:manage",
  "application:review",
  "project:manage",
  "budget:manage",
  "directory:manage",
  "meeting:manage",
];

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  // Villager: no administrative capabilities. Their abilities (raise issue,
  // vote, apply to schemes, view everything public) come from being an active
  // household, not from this matrix.
  user: [],

  // Admin: deliberately MINIMAL — onboard/register villagers and run polls,
  // plus post notices. Nothing sensitive (no moderation, no identities, no
  // documents, no budget).
  admin: ["household:manage", "poll:create", "notice:create"],

  // Reviewer: handles the review workload — moves complaints forward, verifies
  // villagers' scheme applications/documents, and records Gram Sabha minutes
  // (the Sachiv/secretary function).
  reviewer: ["complaint:updateProgress", "application:review", "notice:create", "meeting:manage"],

  // Superadmin: full authority over everything.
  superadmin: ALL_CAPABILITIES,
};

export function roleHasCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

/** Requires the caller to hold a specific capability. Returns the admin user. */
export async function requireCapability(
  request: Request,
  capability: Capability
): Promise<AdminUser> {
  const user = await resolveRole(request);
  if (!roleHasCapability(user.role, capability)) {
    throw new AuthError("Forbidden: insufficient permissions", 403);
  }
  return user;
}

/** Convenience for routes that just need *some* recognized admin-tier role. */
export async function requireAnyAdmin(request: Request): Promise<AdminUser> {
  const user = await resolveRole(request);
  if (user.role === "user") {
    throw new AuthError("Forbidden: admin access required", 403);
  }
  return user;
}
