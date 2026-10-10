// Live proof that Chennai Unsaid runs on AWS, for the demo video: `npm run show-aws`
// Read-only, except one short Bedrock call. Prints no account number and no keys.
import { AmplifyClient, GetAppCommand, ListJobsCommand } from "@aws-sdk/client-amplify";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { GetPublicAccessBlockCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { bedrock, ddb, MODEL_ID, s3, SPOTS_BUCKET, TABLES } from "../lib/aws";

const region = process.env.APP_AWS_REGION ?? "ap-southeast-2";
const APP_ID = "d1v8v4f0epo1xy";
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

function heading(n: number, title: string) {
  console.log(`\n${bold(`${n}. ${title}`)}`);
  console.log("─".repeat(52));
}

async function main() {
  console.log(bold("\nChennai Unsaid · running on AWS (Sydney, ap-southeast-2)\n"));

  heading(1, "Amazon Bedrock · Amazon Nova Lite");
  const ask = "In one short sentence: why should a renter in Chennai check an area's flood history?";
  console.log(`Asking Nova Lite: "${ask}"`);
  const res = await bedrock.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      messages: [{ role: "user", content: [{ text: ask }] }],
      inferenceConfig: { maxTokens: 80, temperature: 0.3 },
    }),
  );
  console.log(green(`Nova Lite: ${res.output?.message?.content?.[0]?.text?.trim()}`));
  await pause(1500);

  heading(2, "Amazon DynamoDB · flood records and spots");
  for (const name of [TABLES.floodRecords, TABLES.heatRatings, TABLES.reports, TABLES.spots]) {
    const t = await ddb.send(new DescribeTableCommand({ TableName: name }));
    const count = await ddb.send(new ScanCommand({ TableName: name, Select: "COUNT" }));
    console.log(`${name.padEnd(14)} ${green(t.Table?.TableStatus ?? "")}  ${count.Count ?? 0} items`);
  }
  const rows = await ddb.send(new ScanCommand({ TableName: TABLES.floodRecords, Limit: 25 }));
  console.log("\nA few FloodRecords rows:");
  for (const r of (rows.Items ?? []).slice(0, 5)) {
    console.log(`  ${String(r.locality).padEnd(16)} ${String(r.date).padEnd(11)} ${String(r.severity).padEnd(9)} ${String(r.source_url).slice(0, 48)}…`);
  }
  await pause(1500);

  heading(3, "Amazon S3 · residents' photos (private)");
  const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: SPOTS_BUCKET }));
  const c = pab.PublicAccessBlockConfiguration ?? {};
  const allBlocked = c.BlockPublicAcls && c.IgnorePublicAcls && c.BlockPublicPolicy && c.RestrictPublicBuckets;
  const objs = await s3.send(new ListObjectsV2Command({ Bucket: SPOTS_BUCKET, Prefix: "spots/" }));
  console.log(`Bucket:        chennai-unsaid-spots`);
  console.log(`Public access: ${allBlocked ? green("blocked (private)") : "NOT fully blocked"}`);
  console.log(`Photos stored: ${objs.KeyCount ?? 0}`);
  await pause(1500);

  heading(4, "AWS Amplify Hosting · the live site");
  const amplify = new AmplifyClient({ region });
  const app = await amplify.send(new GetAppCommand({ appId: APP_ID }));
  const jobs = await amplify.send(new ListJobsCommand({ appId: APP_ID, branchName: "main", maxResults: 1 }));
  const job = jobs.jobSummaries?.[0];
  console.log(`App:           ${app.app?.name}`);
  console.log(`Live at:       https://main.${app.app?.defaultDomain}`);
  console.log(`Last deploy:   #${job?.jobId} ${green(job?.status ?? "")} on ${job?.endTime?.toISOString().slice(0, 16).replace("T", " ")} UTC`);
  console.log(`Runtime access through an IAM role: ${app.app?.computeRoleArn ? green("yes, no keys in the code") : "no"}`);
  console.log("");
}

main().catch((err) => {
  console.error("Couldn't reach AWS:", (err as Error).message);
  console.error("If it says the session expired, run: aws login --region ap-southeast-2 --profile chennai-unsaid");
  process.exit(1);
});
