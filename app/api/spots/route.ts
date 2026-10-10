import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getLocality } from "@/lib/data";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { SEED_SPOTS, listPublicSpots, putSpot, stripJpegMetadata, type SpotRecord } from "@/lib/spots-db";
import { daysSince, insideChennai, KIND, todayIST, type SpotKind } from "@/lib/spots";

const MAX_PHOTO = 2 * 1024 * 1024; // the browser shrinks photos to well under this
const MAX_LANDMARK = 80;
const MAX_NOTE = 120;
const MAX_NAME = 40;

/** Demo entries plus every reviewed community spot. Pending ones never leave the server. */
export async function GET() {
  await connection();
  let community: Awaited<ReturnType<typeof listPublicSpots>> = [];
  let error: string | null = null;
  try {
    community = await listPublicSpots();
  } catch (err) {
    console.error("spots list failed", err);
    error = "Community reports couldn't load right now. Reference spots are still shown.";
  }
  return NextResponse.json({ spots: [...community, ...SEED_SPOTS], error });
}

function clean(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

export async function POST(req: Request) {
  if (rateLimited(`spot:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "That's 5 spots this hour. Thank you. Try again later." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const kind = clean(form.get("kind"), 20) as SpotKind;
  const locality = getLocality(clean(form.get("locality"), 60));
  const landmark = clean(form.get("landmark"), MAX_LANDMARK);
  const note = clean(form.get("note"), MAX_NOTE);
  const seenOn = clean(form.get("seen_on"), 10);
  const by = clean(form.get("by"), MAX_NAME).replace(/[<>]/g, "");
  const consent = form.get("consent") === "yes";
  const photo = form.get("photo");

  if (!KIND[kind]) return NextResponse.json({ error: "Pick what kind of spot it is" }, { status: 400 });
  if (!locality) return NextResponse.json({ error: "Pick the area from the list" }, { status: 400 });
  if (landmark.length < 3) return NextResponse.json({ error: "Add a street or landmark so people can find it" }, { status: 400 });
  if (note.length < 5) return NextResponse.json({ error: "Add one line on why this spot matters" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(seenOn) || seenOn > todayIST() || daysSince(seenOn) > 365) {
    return NextResponse.json({ error: "Pick the date you saw it, within the past year" }, { status: 400 });
  }
  if (!consent) return NextResponse.json({ error: "Please tick the photo checkbox" }, { status: 400 });
  if (!(photo instanceof Blob) || photo.size === 0) return NextResponse.json({ error: "Add a photo" }, { status: 400 });
  if (photo.size > MAX_PHOTO) return NextResponse.json({ error: "That photo is too large. Try another one." }, { status: 400 });

  const jpeg = stripJpegMetadata(Buffer.from(await photo.arrayBuffer()));
  if (!jpeg) return NextResponse.json({ error: "That file isn't a photo we can use. Try a JPG." }, { status: 400 });

  // An exact pin is optional. Without one, the spot sits at the area's centre.
  let lat = Number(form.get("lat"));
  let lon = Number(form.get("lon"));
  const pinned = form.get("lat") !== null && Number.isFinite(lat) && Number.isFinite(lon);
  if (pinned && !insideChennai(lat, lon)) {
    return NextResponse.json({ error: "That pin is outside Chennai. Remove it or try again." }, { status: 400 });
  }
  if (!pinned) {
    lat = locality.lat;
    lon = locality.lon;
  }

  const id = crypto.randomUUID();
  const spot: SpotRecord = {
    id,
    kind,
    status: "pending",
    locality: locality.slug,
    landmark,
    note,
    lat: Math.round(lat * 1e5) / 1e5,
    lon: Math.round(lon * 1e5) / 1e5,
    seen_on: seenOn,
    created_at: new Date().toISOString(),
    photo_key: `spots/${id}.jpg`,
    confirms: 0,
    ...(by ? { by } : {}),
  };

  try {
    await putSpot(spot, jpeg);
  } catch (err) {
    console.error("spot save failed", err);
    return NextResponse.json({ error: "Couldn't save it right now. Please try again in a minute." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
