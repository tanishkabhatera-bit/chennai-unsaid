import { connection } from "next/server";
import { reviewKeyOk } from "@/lib/review-key";
import { getSpot, getSpotPhoto } from "@/lib/spots-db";

/** Photos of reviewed spots are public. Pending ones need the review key. */
export async function GET(req: Request, ctx: RouteContext<"/api/spots/[id]/photo">) {
  await connection();
  const { id } = await ctx.params;
  const spot = /^[0-9a-f-]{36}$/.test(id) ? await getSpot(id) : null;
  if (!spot || spot.status === "rejected") return new Response("Not found", { status: 404 });

  const isPublic = spot.status === "community" || spot.status === "verified";
  if (!isPublic && !reviewKeyOk(req)) return new Response("Not found", { status: 404 });

  const bytes = await getSpotPhoto(spot.photo_key);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": isPublic ? "public, max-age=86400" : "private, no-store",
    },
  });
}
