# Chennai Unsaid

**Track:** Heat and Water
**Live:** https://main.d1v8v4f0epo1xy.amplifyapp.com
**Repo:** https://github.com/tanishkabhatera-bit/chennai-unsaid

## The problem

Chennai floods in the same localities every northeast monsoon. After Cyclone Michaung in December 2023, water stood for up to a week in parts of Pallikaranai, Thoraipakkam, Kodungaiyur and Valasaravakkam. Residents know this. Someone signing a lease or buying a flat usually doesn't, because that history only exists as scattered news articles, and no listing mentions it. Heat is the same: a dense, treeless area or a top floor can be far harder to live in, and nobody tells you before you move.

People make a years-long housing decision with no environmental information. Chennai Unsaid puts it in front of them at the moment they decide.

## What I built

A web app for anyone renting or buying in Chennai. 202 localities, searchable with misspellings.

- **Flood history, area by area.** How high the water came in each year the news reported a flood, with the article behind every mark. A "Now" view shows the last 14 days of reports and live rain.
- **Heat.** Live feels-like temperature, the hottest day and the number of 40°C+ days in the past year, and what that means for an ordinary day. Every number is labelled live, past year or estimate.
- **Check a property.** Enter area, floor and parking, or paste a broker's message. The app reads the listing, checks its claims ("no flooding problem in this street") against the record, gives a verdict by a written rule, and lists the questions to ask before paying the advance.
- **Compare two flats (Climate Compare).** Flooding, heat and water availability side by side, using the same measured indicators over the same period for both, with the source and date on every line, what is unknown, and what to verify.
- **Will your water last?** For a supply cut: household size and storage give the days the water lasts, the day it runs out, the shortfall, tanker loads, and what to do. Uses the CPHEEO 135 L/person/day norm and the Sphere 15 L emergency minimum.
- **Residents' Map.** A community map of shade to rest, cool drink stalls, free drinking water, roads with no shade and waterlogged streets. Each spot has a photo, area and landmark, one line on why it matters, the date seen and an optional name. New spots stay hidden until the photo is checked, and location data is stripped from every photo. Spots are labelled Reference (real places added by the team with a credited photo or news source), Community report or Verified. It launched with 16 real places, including Metro Water ATMs found working in a May 2026 audit and a resident's photo of a Metro Water tanker in Vyasarpadi.
- **Resident reports.** Anonymous: how high the water came, power cuts, dengue, water supply.

An illustrated Chennai auto driver carries the verdicts and reacts to the data (umbrella at ankle-deep, worried at knee-deep, wiping his brow in the heat), so the evidence is easy to read, not decoration.

**What changes for people:** a renter checks the area before signing, takes the second floor instead of the ground floor, asks the landlord in writing whether water entered the building in 2023, and moves the bike before a forecast downpour. On a 40°C day, anyone can find the nearest shade or free drinking water, and add one for the next person.

## Where AWS fits

- **Amazon Bedrock (Amazon Nova Lite, ap-southeast-2).** Read 190 Chennai news articles (DT Next, Deccan Herald, Citizen Matters, 2015–2026) and extracted structured flood records. A second Bedrock pass re-read every article to confirm each record, classified articles as event reports or features, and dropped look-backs, forecasts and complaints. 304 records across 82 localities survived. At runtime Bedrock writes the area summaries (cached 24 hours in DynamoDB), reads pasted listings, and writes the landlord questions.
- **Amazon DynamoDB.** FloodRecords, HeatRatings (202 areas), Reports, SummaryCache and Spots. Every area page, check, comparison and map pin reads live from it.
- **Amazon S3.** A private bucket for Residents' Map photos. Public access is blocked; approved photos are served through the app, and pending ones only to the reviewer.
- **AWS Amplify Hosting.** The Next.js app (SSR) deploys from GitHub on every push. An IAM compute role scoped to the app's tables, the photo bucket and Nova Lite gives the site its AWS access, so there are no keys in the code or the environment.

The verdicts and comparisons are deterministic rules shown in the app, not AI opinions. AI is used to read the news, not to make the decision.

## Data and limits

- Flood records: news reports, neighbourhood level, not street or plot level. No record does not mean no risk.
- Rainfall and heat history: Open-Meteo historical weather (ERA5 reanalysis, about 10 km grid), CC BY 4.0. Live weather: Open-Meteo forecast API.
- Heat ratings: our indicative estimate from coastal distance, tree cover and density, labelled as an estimate.
- Water supply: resident reports only. No official supply or groundwater data is connected yet.
- Resident reports seeded by the team are marked `seeded: true` and labelled "added by the team".

## AI tools used

- **Claude Code** (Anthropic): wrote and debugged the code with me.
- **Amazon Bedrock, Nova Lite**: data extraction and checking, summaries and listing reading inside the app.
- **[Your image tool]**: the auto driver, auto rickshaw, wall, water, sky and icon illustrations.

## Credits

News articles are linked, not copied (the article text is not in the repo). Weather data by Open-Meteo.com (CC BY 4.0). Water norms from the CPHEEO Manual on Water Supply and the Sphere Handbook.
