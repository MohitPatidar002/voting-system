import { AuthError } from "./auth";

// Strip ASCII control characters except newline (10) and tab (9). Built from
// char codes so the source stays pure ASCII (no embedded control bytes).
const CONTROL_CHARS = new RegExp(
  "[" +
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127]
      .map((c) => "\\u" + c.toString(16).padStart(4, "0"))
      .join("") +
    "]",
  "g"
);

/**
 * Trims, removes control characters and enforces a length cap on free text.
 * Output is rendered as text by React (auto-escaped), so the main risks we
 * guard here are oversized payloads and control-character abuse.
 */
export function cleanText(
  value: unknown,
  field: string,
  { min = 1, max = 2000 }: { min?: number; max?: number } = {}
): string {
  if (typeof value !== "string") {
    throw new AuthError(`${field} is required.`, 400);
  }
  const cleaned = value.replace(CONTROL_CHARS, "").trim();
  if (cleaned.length < min) {
    throw new AuthError(`${field} is required.`, 400);
  }
  if (cleaned.length > max) {
    throw new AuthError(`${field} must be at most ${max} characters.`, 400);
  }
  return cleaned;
}

/**
 * Validates an array of image URLs: must be an array, at most `maxCount`, and
 * every entry must be a Firebase Storage URL for this project's bucket. This
 * prevents persisting arbitrary attacker-controlled URLs in the public feed.
 */
export function validateImageUrls(value: unknown, maxCount = 5): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new AuthError("Images must be a list.", 400);
  }
  if (value.length > maxCount) {
    throw new AuthError(`You can upload at most ${maxCount} images.`, 400);
  }
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
  return value.map((url) => {
    if (typeof url !== "string" || url.length > 2048) {
      throw new AuthError("Invalid image reference.", 400);
    }
    const isFirebaseHosted =
      url.startsWith("https://firebasestorage.googleapis.com/") ||
      url.startsWith("https://storage.googleapis.com/");
    if (!isFirebaseHosted || (bucket && !url.includes(bucket))) {
      throw new AuthError("Images must be uploaded through this app.", 400);
    }
    return url;
  });
}
