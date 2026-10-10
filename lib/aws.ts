import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

// The project is a new-experience AWS account, locked to Sydney.
const region = process.env.APP_AWS_REGION ?? "ap-southeast-2";

// Explicit keys win if set. Otherwise the SDK's default chain is used: the
// `aws login` profile (AWS_PROFILE) locally, or the Amplify compute role when deployed.
const credentials =
  process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

export const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? "apac.amazon.nova-lite-v1:0";

export const TABLES = {
  floodRecords: "FloodRecords",
  heatRatings: "HeatRatings",
  reports: "Reports",
  summaryCache: "SummaryCache",
  spots: "Spots",
} as const;

/** Private bucket for community spot photos. Served only through /api/spots/[id]/photo. */
export const SPOTS_BUCKET = process.env.SPOTS_BUCKET ?? "chennai-unsaid-spots-308054410599";

export const bedrock = new BedrockRuntimeClient({ region, credentials });

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region, credentials }), {
  marshallOptions: { removeUndefinedValues: true },
});

export const s3 = new S3Client({ region, credentials });
