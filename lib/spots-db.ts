import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, s3, SPOTS_BUCKET, TABLES } from "./aws";
import seedJson from "@/data/seed-spots.json";
import { CONFIRMS_TO_VERIFY, type PublicSpot, type SpotKind, type SpotStatus } from "./spots";

/** One row in the Spots table. */
export interface SpotRecord {
  id: string;
  kind: SpotKind;
  status: SpotStatus;
  locality: string;
  landmark: string;
  note: string;
  lat: number;
  lon: number;
  seen_on: string;
  created_at: string;
  photo_key: string;
  confirms: number;
  /** Optional name shown on the spot. */
  by?: string;
  reviewed_at?: string;
}

/** Reference spots (real places, credited photos) and the few demo entries left. */
export const SEED_SPOTS = seedJson as PublicSpot[];

export function toPublic(r: SpotRecord): PublicSpot {
  return {
    id: r.id,
    kind: r.kind,
    trust: r.status === "verified" || r.confirms >= CONFIRMS_TO_VERIFY ? "verified" : "community",
    locality: r.locality,
    landmark: r.landmark,
    note: r.note,
    lat: r.lat,
    lon: r.lon,
    seen_on: r.seen_on,
    confirms: r.confirms,
    by: r.by || null,
    photo: `/api/spots/${r.id}/photo`,
  };
}

async function scanByStatus(statuses: SpotStatus[]): Promise<SpotRecord[]> {
  const names = statuses.map((_, i) => `:s${i}`);
  const items: SpotRecord[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: TABLES.spots,
        FilterExpression: `#st IN (${names.join(", ")})`,
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: Object.fromEntries(statuses.map((s, i) => [names[i], s])),
        ExclusiveStartKey: start,
      }),
    );
    items.push(...((res.Items ?? []) as SpotRecord[]));
    start = res.LastEvaluatedKey;
  } while (start);
  return items;
}

/** Spots the public can see: reviewed community reports and verified ones. */
export async function listPublicSpots(): Promise<PublicSpot[]> {
  const rows = await scanByStatus(["community", "verified"]);
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).map(toPublic);
}

export async function listPendingSpots(): Promise<SpotRecord[]> {
  const rows = await scanByStatus(["pending"]);
  return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getSpot(id: string): Promise<SpotRecord | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.spots, Key: { id } }));
  return (res.Item as SpotRecord) ?? null;
}

export async function putSpot(spot: SpotRecord, photo: Buffer): Promise<void> {
  // Photo first: a row without its photo would show a broken image.
  await s3.send(
    new PutObjectCommand({ Bucket: SPOTS_BUCKET, Key: spot.photo_key, Body: photo, ContentType: "image/jpeg" }),
  );
  await ddb.send(new PutCommand({ TableName: TABLES.spots, Item: spot }));
}

export async function setSpotStatus(id: string, status: SpotStatus): Promise<SpotRecord | null> {
  const spot = await getSpot(id);
  if (!spot) return null;
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.spots,
      Key: { id },
      UpdateExpression: "SET #st = :s, reviewed_at = :t",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":s": status, ":t": new Date().toISOString() },
    }),
  );
  // A rejected photo is deleted, not kept around.
  if (status === "rejected") await s3.send(new DeleteObjectCommand({ Bucket: SPOTS_BUCKET, Key: spot.photo_key }));
  return { ...spot, status };
}

/** "Still here": only counts on spots the public can see. Returns the new count. */
export async function confirmSpot(id: string): Promise<number | null> {
  try {
    const res = await ddb.send(
      new UpdateCommand({
        TableName: TABLES.spots,
        Key: { id },
        UpdateExpression: "ADD confirms :one",
        ConditionExpression: "#st IN (:c, :v)",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":one": 1, ":c": "community", ":v": "verified" },
        ReturnValues: "UPDATED_NEW",
      }),
    );
    return Number(res.Attributes?.confirms ?? 0);
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") return null;
    throw err;
  }
}

export async function getSpotPhoto(key: string): Promise<Uint8Array | null> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: SPOTS_BUCKET, Key: key }));
    return res.Body ? await res.Body.transformToByteArray() : null;
  } catch {
    return null;
  }
}

/**
 * Removes metadata from a JPEG: EXIF (which can hold the phone's GPS location),
 * XMP, IPTC and comments. The browser already re-draws the photo, which drops
 * these, so this is the backstop. Returns null if the bytes aren't a JPEG.
 */
export function stripJpegMetadata(buf: Buffer): Buffer | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  const out: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0xff) {
      i += 1; // fill byte
      continue;
    }
    if (marker === 0xda) {
      out.push(buf.subarray(i)); // start of scan: the rest is image data
      break;
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      out.push(buf.subarray(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 4 > buf.length) return null;
    const len = buf.readUInt16BE(i + 2);
    const end = i + 2 + len;
    if (len < 2 || end > buf.length) return null;
    // Drop APP1 (EXIF, XMP), APP13 (IPTC) and COM (comments). Keep everything else.
    if (marker !== 0xe1 && marker !== 0xed && marker !== 0xfe) out.push(buf.subarray(i, end));
    i = end;
  }
  return Buffer.concat(out);
}
