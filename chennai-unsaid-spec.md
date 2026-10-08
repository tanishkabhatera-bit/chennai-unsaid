# Chennai Unsaid — Complete Build Guide

*Working name; rename freely. Built for Environmental Hacks, Bharat Builds Tour (WeMakeDevs × AWS). Track: **Heat and Water**.*

---

## Part A — The Product

### A1. One-line pitch

**What brokers, landlords and listings never tell you about a Chennai area: whether it floods, how hot it runs, and what residents actually go through every monsoon.**

### A2. The problem, with evidence

- Chennai floods in the same localities every northeast monsoon. The Greater Chennai Corporation reported waterlogging in **57 localities** after a single night of rain this season (Deccan Herald).
- Water stayed for up to a **week** in Pallikaranai, Thoraipakkam, Kodungaiyur and Valasavakkam after Cyclone Michaung (DT Next).
- This history exists only as thousands of scattered news articles. **No one has put it in one searchable place.**
- Dense concrete localities (T Nagar, Koyambedu) run hotter than green or coastal ones (Adyar, Besant Nagar). No listing says this.
- Power cuts after rain, dengue after waterlogging, tanker dependence: residents know, newcomers don't.
- People choosing where to live, rent a PG, or open a shop make a years-long decision with **zero environmental information**.

### A3. Who it's for

- **Primary:** someone about to rent or buy a home or PG in Chennai (students, new hires, families).
- **Secondary:** someone already living in an area who wants to prepare before the monsoon.

### A4. What it does (exactly five things)

1. **Search** any Chennai locality.
2. **Flood history** for that locality, year by year, each entry linked to the news article that proves it.
3. **Heat rating** (Cooler / Average / Hotter) with a one-line reason.
4. **Resident reports** in five fixed categories: Flooding, Heat, Power cuts during rain, Dengue after waterlogging, Water supply / tankers.
5. **AI summary**: one honest paragraph combining history, heat and reports, ending with two questions to ask the landlord or seller.

Optional sixth, only if everything above works: **compare two localities** side by side.

### A5. What it does NOT do (do not build these)

- Login or user accounts
- Anything outside Heat and Water (food hygiene, crime, delivery safety)
- Street-level or building-level data (locality level only)
- Travel planning, parking, venues, shops
- "Don't live here" verdicts. The app **informs**, it never blacklists.
- Cities other than Chennai (the video will say the method works anywhere)

### A6. Tone rules for all text in the app

- Neutral and factual. "Flooded in 4 of the last 10 monsoons", never "terrible area".
- Every flood claim links to its source.
- Heat ratings are labelled "indicative".
- Resident reports are anonymous and shown as counts plus short quotes.

---

## Part B — Screens

### B1. Home (`/`)

- Headline: **Know the area before you sign.**
- Sub-line: *Flood history, heat, and what residents say. The things listings leave out.*
- Large search box with placeholder "Type a Chennai locality, e.g. Velachery". Autocomplete from the locality list (Part C4).
- Three example chips: **Velachery · T Nagar · Adyar**
- Small footer line: "Built on AWS for the Bharat Builds Tour."

### B2. Area Report (`/area/[slug]`)

Order top to bottom:

1. **Header:** locality name + overall badge (**Low / Moderate / High flood risk**) computed from Part C5.
2. **AI summary card:** 3–5 plain sentences + "Two questions to ask" list. Shows a skeleton loader while generating. If AI fails, shows "Summary unavailable, see the data below" and the page still works.
3. **Flood history:** vertical timeline, newest first. Each item: year, event name (if any), severity chip, "water stayed N days" (if known), one-line detail, **Source →** link opening in new tab.
4. **Heat card:** rating chip + reason + "Indicative, based on tree cover, coastal distance and density."
5. **Resident reports:** five category counters, then the latest five reports (category, month/year, text). Empty state: "No resident reports yet. Be the first."
6. **Buttons:** "Report something about this area" · "Compare with another area" (only if built).

### B3. Report modal

Fields: Locality (prefilled, read-only) · Category (dropdown, five options) · What happened (textarea, max 280 chars) · When (month + year selects).
No name, no email. On submit: show "Thanks, added." and refresh the reports list.

### B4. Compare (`/compare?a=velachery&b=adyar`) — optional

Two columns, same sections as the Area Report, AI summary replaced by one comparison paragraph.

### B5. Design rules

- Mobile-first. Everything must work on a phone screen.
- One accent colour, plenty of white space, readable fonts.
- Severity colours: minor = amber, moderate = orange, severe = red. Heat: Cooler = blue, Average = grey, Hotter = red.
- Every external link opens in a new tab.

---

## Part C — Data

### C1. Flood records (the core; build this first)

**Source:** news articles about Chennai flooding and waterlogging, 2015 to today. Outlets: DT Next, The Hindu, Deccan Herald, Citizen Matters, Times of India, NDTV, The New Indian Express.

**How to collect:** search Google for `Chennai waterlogging <locality>` and `Chennai floods <year> <locality>`. Keep a spreadsheet with columns: `url`, `title`, `outlet`, `published_date`. Target **50–100 articles**. Big events to cover: Dec 2015 floods, Nov 2017, Nov 2021, Dec 2023 (Cyclone Michaung), Oct–Nov 2024, and the 2026 monsoon.

**How to extract:** for each article, send its text to Bedrock with the extraction prompt (Part D1). The AI returns records like:

```json
{
  "locality": "Velachery",
  "date": "2023-12-05",
  "event": "Cyclone Michaung",
  "severity": "severe",
  "water_stayed_days": 7,
  "detail": "Rainwater entered houses; residents moved to relief camps",
  "source_url": "https://...",
  "source_title": "Chennai floods: Water yet to recede in many areas"
}
```

One article usually yields several records (one per locality named).

**Getting article text:** try fetching the URL from a small script first. Many news sites block scripts. If blocked, open the article in a browser, copy the text, and paste it into a local `articles/<id>.txt` file. **Manual copy-paste of 50 articles is a valid plan** and takes about two hours.

**Normalise locality names** before saving: map variants to one canonical slug (e.g. "Velacheri", "Velachery" → `velachery`; "T. Nagar", "Thyagaraya Nagar" → `t-nagar`).

### C2. Heat ratings

A static JSON file, one entry per locality, written once:

```json
{ "locality": "t-nagar", "rating": "Hotter", "reason": "Dense commercial built-up area, very low tree cover, about 5 km from the coast", "coast_km": 5 }
```

Rules of thumb: within 3 km of the coast or next to large green/water bodies → **Cooler**; dense commercial or industrial with little greenery and > 5 km inland → **Hotter**; everything else → **Average**. Label it indicative in the UI. If you find a published Chennai urban-heat study or NASA land-surface-temperature map, cite it in the README.

### C3. Resident reports

Stored as submitted, anonymous. **Pre-seed 15–20 realistic reports** across several localities so the demo isn't empty. Mark them `seeded: true` in the database and say so in the README. Honesty here costs nothing and judges respect it.

### C4. Locality list

Around 60 localities covering the whole city. Minimum set to include:

Adyar, Alandur, Ambattur, Anna Nagar, Arumbakkam, Ashok Nagar, Avadi, Besant Nagar, Chromepet, Egmore, Guindy, Kilpauk, Kodambakkam, Kodungaiyur, Kolathur, Korattur, Kotturpuram, Koyambedu, Madipakkam, Madhavaram, Medavakkam, Mogappair, Mylapore, Nungambakkam, OMR / Sholinganallur, Pallavaram, Pallikaranai, Perambur, Perungudi, Porur, Poonamallee, Purasawalkam, Royapettah, Saidapet, Tambaram, Thiruvanmiyur, Thoraipakkam, Tiruvottiyur, T Nagar, Triplicane, Valasaravakkam, Vadapalani, Velachery, Villivakkam, Virugambakkam, West Mambalam.

Store as `{ "slug": "velachery", "name": "Velachery", "aliases": ["Velacheri"] }`.

### C5. Risk badge logic (simple and explainable)

- Count distinct **years** with any flood record for the locality in the last 10 years.
- **High:** 4+ years, or any record with `water_stayed_days ≥ 5`
- **Moderate:** 2–3 years
- **Low:** 0–1 years
- Show the rule in a tooltip so users see it's transparent.

---

## Part D — The AI (Amazon Bedrock)

Use **Amazon Nova Lite** (cheap, fast, available in us-east-1). If unavailable, use Claude 3 Haiku via Bedrock.

### D1. Extraction prompt (run once per article while seeding)

```
You extract flood records from a news article about Chennai, India.
Return ONLY a JSON array, no prose.
For every Chennai locality the article says was waterlogged, flooded or inundated, output one object:
{
 "locality": string (as written in the article),
 "date": ISO date YYYY-MM-DD (use the article's published date if the event date is not stated),
 "event": string or null (e.g. "Cyclone Michaung"),
 "severity": "minor" | "moderate" | "severe"
   (minor = roads waterlogged; moderate = traffic disrupted or knee-deep water; severe = water in homes, evacuations, relief camps, deaths),
 "water_stayed_days": integer or null (only if the article states a duration),
 "detail": one sentence, only facts stated in the article
}
Use only facts in the article. If no locality qualifies, return [].

ARTICLE TITLE: {title}
ARTICLE URL: {url}
ARTICLE TEXT:
{text}
```

### D2. Summary prompt (run live, cached 24 hours per locality)

```
You write a short, neutral briefing for someone deciding whether to live in {locality}, Chennai.

FLOOD RECORDS (JSON): {records}
HEAT RATING: {rating} — {reason}
RESIDENT REPORTS (JSON): {reports}

Write 3 to 5 plain sentences covering: how many of the last 10 monsoons it flooded and roughly when in the year; how long water stayed when known; heat exposure; the most-reported resident issues.
Then write a line "Two questions to ask before you commit:" followed by two specific questions (e.g. about floor level, basement parking, past water entry, backup power, tanker dependence).
Rules: never say "don't live here" or "avoid this area"; never invent facts not in the data; if data is thin, say so plainly.
```

### D3. Cost control

- Cache every summary in `SummaryCache` with `generated_at`. Regenerate only if older than 24 hours or if a new report was added.
- Nova Lite costs a fraction of a paisa per summary; the free tier covers this project many times over.

---

## Part E — Architecture

```
Browser (phone or laptop)
   │
Next.js 14 app  ──  hosted on AWS Amplify Hosting (auto-deploys from GitHub main)
   │   API routes live inside the same app (/app/api/...)
   ├── Amazon Bedrock Runtime  → extraction (seeding) + live summaries
   ├── Amazon DynamoDB         → FloodRecords, HeatRatings, Reports, SummaryCache
   └── Amazon S3 (optional)    → raw article text, kept as proof
```

**Why this shape:** one codebase, one deploy, nothing else to run. Amplify gives a public URL. Bedrock + DynamoDB satisfy the "deployed on AWS" prize rule.

### E1. DynamoDB tables

| Table | Partition key | Sort key | Notes |
|---|---|---|---|
| `FloodRecords` | `locality` (string) | `sk` (string) = `date#hash(source_url)` | one row per locality per article |
| `HeatRatings` | `locality` | — | one row per locality |
| `Reports` | `locality` | `created_at` (ISO string) | `seeded` boolean attribute |
| `SummaryCache` | `locality` | — | `summary`, `generated_at` |

All on-demand capacity, default settings.

### E2. API routes

| Route | Method | Does |
|---|---|---|
| `/api/localities` | GET | returns locality list for autocomplete |
| `/api/area/[slug]` | GET | returns flood records, heat rating, report counts, latest reports, risk badge |
| `/api/area/[slug]/summary` | GET | returns cached summary or generates via Bedrock |
| `/api/reports` | POST | validates and stores a report; rate-limit by IP to 5/hour |
| `/api/compare` | GET | optional; two slugs → both datasets + comparison paragraph |

### E3. Environment variables

Use these exact names (Amplify blocks variables that start with `AWS_`):

```
APP_AWS_ACCESS_KEY_ID=
APP_AWS_SECRET_ACCESS_KEY=
APP_AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
```

Locally they live in `.env.local` (already git-ignored). On Amplify they go under App settings → Environment variables.

**Never** paste these keys into GitHub, chat, Discord, screenshots or the demo video.

### E4. Repo layout

```
chennai-unsaid/
  app/                 pages and API routes
  components/          UI pieces
  data/
    localities.json
    heat-ratings.json
    seed-reports.json
  scripts/
    extract.ts         reads articles/*.txt, calls Bedrock, writes records
    load.ts            writes records, heat ratings and seed reports into DynamoDB
  articles/            raw article text files (git-ignored if large)
  docs/
    architecture.png
  README.md
  chennai-unsaid-spec.md   (this file)
```

---

## Part F — Setup, step by step

Do these in order. Each step depends on the one before.

### F1. Install tools

1. **Node.js** — nodejs.org → download **LTS** → install with defaults.
2. **Git** — git-scm.com → download → install with defaults.
3. **Editor with AI** — install **Cursor** (cursor.com), or VS Code with GitHub Copilot Free.
4. Verify in a terminal (Cursor: View → Terminal):
   ```
   node -v
   git -v
   ```
   Both print a version. If not, restart the laptop and retry.

### F2. GitHub + project

1. Create a GitHub account.
2. New repository → name `chennai-unsaid` → **Public** → tick **Add a README** → Create.
3. In the terminal:
   ```
   npx create-next-app@latest chennai-unsaid
   ```
   Answers: TypeScript **Yes** · ESLint **Yes** · Tailwind **Yes** · `src/` directory **No** · App Router **Yes** · Turbopack **Yes** · import alias **No**.
4. Run it:
   ```
   cd chennai-unsaid
   npm run dev
   ```
   Open `http://localhost:3000`. A Next.js page appears. The project runs.
5. Copy this spec into the folder.
6. Connect and push (ask the editor's AI: "connect this folder to my GitHub repo chennai-unsaid and push to main"). **The first push timestamps your start**, which the rules require.

### F3. AWS account

1. Sign up at aws.amazon.com. Debit card or RuPay works; about ₹2 is charged for verification. Pick the **Free plan** if offered.
2. **Region:** top-right of the console → **US East (N. Virginia) us-east-1**. Use it everywhere.
3. **Spending alarm:** search "Budgets" → Create budget → **Zero spend budget** → your email. You'll be emailed if anything costs money.
4. **Bedrock:** search "Bedrock" → Model catalog → **Amazon Nova Lite** → open Playground → type "Hello". If it asks for access, request it (usually instant).
5. **DynamoDB:** search "DynamoDB" → Create table, four times, using the names and keys in E1. Leave everything else default.
6. **IAM user:** search "IAM" → Users → Create user → name `chennai-unsaid-app` → **Attach policies directly** → tick `AmazonDynamoDBFullAccess` and `AmazonBedrockFullAccess` → Create. Open the user → Security credentials → **Create access key** → "Application running outside AWS" → copy both values.
7. Create `.env.local` in the project folder with the four variables from E3.

### F4. Build order

Finish each step end to end before starting the next.

1. **Mock data first.** Build Home and Area Report using `data/*.json` with three localities. No AWS yet. Make it look right on a phone.
2. **Extraction script.** Put 5 article texts in `articles/`. Run `scripts/extract.ts`. Check the JSON by hand. Fix the prompt if it invents anything.
3. **Run extraction on everything** you've collected. Review a sample of 20 records against their articles.
4. **Load script.** Write records, heat ratings and seed reports into DynamoDB.
5. **Connect the Area Report** to `/api/area/[slug]`. Real data on screen.
6. **Deploy to Amplify** (F5). Fix hosting issues now, not at the end.
7. **Report form** + `/api/reports`. Submit one from your phone on the live URL.
8. **AI summary** + cache. Test on 10 localities. Tighten the prompt until no output invents facts.
9. **Polish:** loading states, empty states, link targets, mobile spacing.
10. **Compare page** — only if steps 1–9 are done and tested.

Commit after every step. Small, frequent commits make a healthy history.

### F5. Deploy to Amplify

1. Search "Amplify" → **Create new app** → **GitHub** → authorise → choose `chennai-unsaid`, branch `main`.
2. Amplify auto-detects Next.js. Open **Environment variables** → add the four values from E3.
3. Deploy. A public `*.amplifyapp.com` URL appears in a few minutes.
4. **Known snag:** site loads but data/AI calls fail. Fix: in `amplify.yml`, during the build phase, write the variables into `.env.production`:
   ```yaml
   build:
     commands:
       - env | grep -E '^(APP_AWS_|BEDROCK_)' >> .env.production
       - npm run build
   ```
   Redeploy.
5. Open the live URL on your phone, signed out of everything. Everything must work there.

---

## Part G — Starter prompt for your AI coding tool

Paste this into Cursor / Claude Code as the first message:

```
Read chennai-unsaid-spec.md in this folder and build it in the order given in Part F4.

Stack: Next.js 14 App Router, TypeScript, Tailwind. AWS SDK v3 for DynamoDB and Bedrock Runtime, called only from API routes. Read credentials from APP_AWS_ACCESS_KEY_ID, APP_AWS_SECRET_ACCESS_KEY, APP_AWS_REGION and BEDROCK_MODEL_ID.

Start with step 1 only: Home page with autocomplete over data/localities.json, and the Area Report page using mock JSON for three localities (Velachery, T Nagar, Adyar). Mobile-first. Do not touch AWS yet.

After each step, tell me exactly what command to run and what I should see. Stop and wait for me before starting the next step.
```

Then, for each later step, say: "Step 2 now" and so on.

---

## Part H — Submission

### H1. Rules that affect you

- Project work must start after the hackathon opened; commit history must match. (Your first push handles this.)
- Project must use AWS and the **video must show it**. Naming AWS in text alone is not enough.
- AI coding tools are allowed; **list them in the writeup**.
- Submission = **public repo + YouTube video under 3 minutes + short writeup**, once per team, on the event's form, before the deadline shown there. Deadlines are strict.
- Judges score only what the video shows.

### H2. Checklist

- [ ] Public GitHub repo, first commit dated on or after Oct 8
- [ ] README: pitch, screenshots, how to run locally, AWS services used, AI tools used, seeded data disclosed, data sources listed
- [ ] `docs/architecture.png` (a simple boxes-and-arrows image of Part E)
- [ ] Live Amplify URL opens with no login, on a phone, signed out
- [ ] YouTube video ≤ 3:00, set to **Unlisted** or Public, link tested in a signed-out browser
- [ ] Writeup: problem · what you built · where AWS fits · AI tools used
- [ ] Track selected: **Heat and Water**
- [ ] Blog published on AWS Builder Center, link added to submission
- [ ] Student verification complete on Builder Center
- [ ] Submitted with time to spare

### H3. Demo video script (target 2:45)

| Time | What's on screen | What you say |
|---|---|---|
| 0:00–0:25 | You, on camera | "I fainted from heat in Chennai because nobody told me how hot it was outside. Then I realised nobody tells you anything about an area before you move in." |
| 0:25–0:50 | 2–3 real headlines | "The same 57 localities flood every monsoon. Residents know. Newcomers don't. That history is scattered across ten years of news." |
| 0:50–2:00 | Live app | Search Velachery → flood timeline with source links → heat rating → resident reports → AI summary and landlord questions. Search Adyar for contrast. Submit one report. |
| 2:00–2:30 | Architecture diagram | "Bedrock read the articles and writes every summary. DynamoDB holds the records. Amplify hosts it." |
| 2:30–2:45 | App on a phone | "Built for Chennai; the method works for any Indian city. Reports grow with residents. Next: water supply data." End card with name, repo, URL. |

Record with OBS (free) or your phone. Rehearse twice. Keep the browser zoomed so text is readable.

### H4. Blog outline (top-5 blogs prize)

Title idea: *I made AI read ten years of Chennai flood news so renters wouldn't have to*

1. The fainting story and the question it raised
2. Why Chennai has no flood memory
3. What the app does, with screenshots
4. How Bedrock turned messy articles into structured records — one real before/after
5. What went wrong and how you fixed it (be specific; judges value this)
6. What's next

Publish on AWS Builder Center. Link it in the submission.

---

## Part I — When things go wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| `node` not recognised | PATH not updated | restart laptop; reinstall Node LTS |
| Bedrock "AccessDeniedException" | model access not granted, or wrong region | request access in Model catalog; confirm us-east-1 everywhere |
| Bedrock "ValidationException" on model ID | wrong `BEDROCK_MODEL_ID` | copy the exact ID from the Model catalog page |
| DynamoDB "ResourceNotFoundException" | table name or region mismatch | check spelling and region |
| Works locally, fails on Amplify | env vars not reaching runtime | apply the `amplify.yml` fix in F5 step 4 |
| Extraction invents localities | prompt too loose | add "Only localities explicitly named in the article" and re-run |
| Summary says "don't live here" | prompt not enforced | strengthen the Rules line; add a post-check that rejects the phrase |
| Article fetch blocked | site blocks scripts | copy-paste text into `articles/*.txt` |
| Stuck > 30 minutes | — | paste the exact error into the WeMakeDevs Discord or back into this chat |

---

## Part J — Working rules

1. One feature working end to end before the next.
2. Deploy early. Hosting problems always surface.
3. If the video can't show it, it doesn't count. Build what the video needs.
4. Never paste AWS keys anywhere but `.env.local` and Amplify settings.
5. Thirty minutes stuck means ask for help.
6. Commit after every working step.
