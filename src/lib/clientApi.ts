import { auth } from "./firebase/config";

/**
 * Client-side fetch that automatically attaches the current user's Firebase ID
 * token. Keeps every page from re-implementing token plumbing.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/**
 * Storage rules for staff-only folders (projects/, directory/) check the
 * `role` custom claim on the ID token. The claim is provisioned server-side on
 * the first authenticated API call, but the token cached in the browser can
 * predate it — so before a direct-to-Storage staff upload we force a one-time
 * token refresh to make sure the claim is present.
 */
let roleTokenRefreshed = false;
export async function ensureFreshRoleToken(): Promise<void> {
  if (roleTokenRefreshed || !auth.currentUser) return;
  await auth.currentUser.getIdToken(true);
  roleTokenRefreshed = true;
}
