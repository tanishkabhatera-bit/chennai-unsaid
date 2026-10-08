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

Step 1 of the build: Home and Area Report pages running on sample data for Velachery, T Nagar and Adyar. Amazon Bedrock and DynamoDB come next.

## Data honesty

- `data/mock/` holds **sample** flood records and summaries used only to build the layout. Their source links are news searches, not specific articles. They will be replaced by records extracted from real news articles.
- `data/seed-reports.json` holds resident reports **written by the team** so the demo isn't empty. They are marked `seeded: true`.

See `chennai-unsaid-spec.md` for the full build spec.
