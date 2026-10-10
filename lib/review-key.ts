import { timingSafeEqual } from "node:crypto";

/** The review page sends the key in a header. No key configured means no reviewing. */
export function reviewKeyOk(req: Request): boolean {
  const expected = process.env.SPOTS_REVIEW_KEY;
  const given = req.headers.get("x-review-key");
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
