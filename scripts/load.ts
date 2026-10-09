// Spec F4 step 4: write flood records, heat ratings and seed reports into DynamoDB.
//
//   npm run load              everything
//   npm run load -- floods    just one of: floods | heat | reports
import { readFile } from "node:fs/promises";
import { BatchWriteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "../lib/aws";
import type { FloodRecord, HeatRating, Report } from "../lib/types";

type Put = { PutRequest: { Item: Record<string, unknown> } };

async function batchPut(table: string, items: object[]) {
  for (let i = 0; i < items.length; i += 25) {
    let requests: Put[] = items.slice(i, i + 25).map((item) => ({ PutRequest: { Item: { ...item } } }));
    // DynamoDB may return some unprocessed items under load; retry those.
    while (requests.length) {
      const res = await ddb.send(new BatchWriteCommand({ RequestItems: { [table]: requests } }));
      requests = (res.UnprocessedItems?.[table] ?? []) as Put[];
      if (requests.length) await new Promise((r) => setTimeout(r, 500));
    }
  }
  console.log(`${table}: ${items.length} items written`);
}

async function clearTable(table: string, keys: string[]) {
  let deleted = 0;
  let start: Record<string, unknown> | undefined;
  do {
    const page = await ddb.send(new ScanCommand({ TableName: table, ProjectionExpression: keys.join(", "), ExclusiveStartKey: start }));
    const items = page.Items ?? [];
    for (let i = 0; i < items.length; i += 25) {
      let requests = items.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } }));
      while (requests.length) {
        const res = await ddb.send(new BatchWriteCommand({ RequestItems: { [table]: requests } }));
        requests = (res.UnprocessedItems?.[table] ?? []) as typeof requests;
        if (requests.length) await new Promise((r) => setTimeout(r, 500));
      }
    }
    deleted += items.length;
    start = page.LastEvaluatedKey;
  } while (start);
  console.log(`${table}: ${deleted} old items removed`);
}

async function json<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8"));
}

async function main() {
  const only = process.argv[2];

  if (!only || only === "floods") {
    // The audit can drop records, so clear the table first rather than leaving stale rows behind.
    await clearTable(TABLES.floodRecords, ["locality", "sk"]);
    await batchPut(TABLES.floodRecords, await json<FloodRecord[]>("data/flood-records.json"));
  }
  if (!only || only === "heat") {
    await batchPut(TABLES.heatRatings, await json<HeatRating[]>("data/heat-ratings.json"));
  }
  if (!only || only === "reports") {
    await batchPut(TABLES.reports, await json<Report[]>("data/seed-reports.json"));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
