# Chennai Unsaid

**What brokers, landlords and listings never tell you about a Chennai area: whether it floods, how hot it runs, and what residents actually go through every monsoon.**

Built for Environmental Hacks, Bharat Builds Tour (WeMakeDevs × AWS). Track: Heat and Water.

## What it does

1. Search any Chennai locality.
2. Flood history, year by year, each entry linked to the news article behind it.
3. Heat rating (Cooler / Average / Hotter) with a one-line reason.
4. Anonymous resident reports in five categories.
5. An AI summary ending with two questions to ask the landlord or seller.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Status

Area Report pages read live from Amazon DynamoDB (Sydney, ap-southeast-2): 338 flood records across 82 localities, extracted by Amazon Nova Lite on Bedrock from 69 news articles (2015–2026).

## Data

- **Flood records** (`data/flood-records.json`, `data/extracted/`): extracted by Bedrock from articles listed in `articles/urls.txt` (DT Next, Deccan Herald, Citizen Matters). Every record links to its source. `npm run verify` checks that each record's locality is named in its article. Article text itself is not committed (copyright).
- **Heat ratings** (`data/heat-ratings.json`): indicative, written by the team from coastal distance, tree cover and density.
- **Resident reports** (`data/seed-reports.json`): **written by the team** so the demo isn't empty, marked `seeded: true`.

## Pipeline

```bash
npm run fetch-articles   # download articles/urls.txt into articles/*.txt
npm run extract          # Bedrock → data/flood-records.json
npm run verify           # check records against articles
npm run load             # write everything to DynamoDB
```

See `chennai-unsaid-spec.md` for the full build spec.
