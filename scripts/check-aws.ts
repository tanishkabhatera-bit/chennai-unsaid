// Quick connectivity check: `npm run check-aws`
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrock, ddb, MODEL_ID } from "../lib/aws";

async function main() {
  const tables = await ddb.send(new ListTablesCommand({}));
  console.log("DynamoDB OK:", tables.TableNames?.join(", "));

  try {
    const res = await bedrock.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        messages: [{ role: "user", content: [{ text: "Say hello in one short sentence." }] }],
        inferenceConfig: { maxTokens: 50 },
      }),
    );
    console.log("Bedrock OK:", res.output?.message?.content?.[0]?.text);
  } catch (err) {
    console.log("Bedrock NOT ready:", (err as Error).message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
