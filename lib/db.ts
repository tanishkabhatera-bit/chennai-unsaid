import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "./aws";
import type { FloodRecord, HeatRating, Report, Summary } from "./types";

export async function queryFloodRecords(locality: string): Promise<FloodRecord[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.floodRecords,
      KeyConditionExpression: "locality = :l",
      ExpressionAttributeValues: { ":l": locality },
      ScanIndexForward: false, // sk starts with the date, so newest first
    }),
  );
  return (res.Items ?? []) as FloodRecord[];
}

export async function getHeatRating(locality: string): Promise<HeatRating | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.heatRatings, Key: { locality } }));
  return (res.Item as HeatRating) ?? null;
}

export async function queryReports(locality: string): Promise<Report[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.reports,
      KeyConditionExpression: "locality = :l",
      ExpressionAttributeValues: { ":l": locality },
      ScanIndexForward: false, // newest first
    }),
  );
  return (res.Items ?? []) as Report[];
}

export async function putReport(report: Report): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.reports, Item: report }));
}

export async function getCachedSummary(locality: string): Promise<Summary | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.summaryCache, Key: { locality } }));
  return (res.Item as Summary) ?? null;
}

export async function putSummary(summary: Summary): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.summaryCache, Item: summary }));
}
