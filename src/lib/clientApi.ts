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
