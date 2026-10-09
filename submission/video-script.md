# Demo video script (target 2:45, hard limit 3:00)

Rules that shape this video:
- Judges only see the video. No live demo.
- "Your project has to use AWS, and your demo video has to show it." So AWS gets its own 35 seconds, on screen, in the AWS console.
- Say who it's for and what changes for them in the first 15 seconds.

Live site: https://main.d1v8v4f0epo1xy.amplifyapp.com

---

## 0:00 – 0:15 · You, on camera

**Say:**
"I fainted from the heat in Chennai because nobody told me how hot it actually gets. Then I realised nobody tells you anything about an area before you move in. Not the broker, not the listing, not the landlord. So I built Chennai Unsaid."

## 0:15 – 0:35 · The problem (screen)

**Show:** the DT Next article "Chennai floods: Water yet to recede in many areas of the city" (Dec 2023). Scroll slowly past the line naming Pallikaranai, Thoraipakkam, Kodungaiyur.

**Say:**
"The same areas flood every monsoon. After Cyclone Michaung, water stood for a week in some of them. Residents know this. Someone signing a lease next month doesn't. That history is scattered across ten years of news, and no listing mentions it."

## 0:35 – 1:05 · Water (live site)

**Show:** home page. Headline "A place can look perfect. Until it rains."
1. Type **Velachery**. The auto anna says "No flooding reported here in the last 14 days."
2. Tap **2023**. Water rises knee-deep over the auto. Bubble: "Cyclone Michaung, 2023: Knee deep." Point at the **Source** link under the wall.
3. Tap him once: the advice line.

**Say:**
"Pick an area. Now shows the last two weeks. Each year shows how high the water came, from the news, with the article right there. Every mark has a source."

## 1:05 – 1:20 · Heat

**Show:** switch to **HEAT**. He wipes his brow. Tap him: he drinks water and gives advice. Point at the **Live** and **Past year** tags.

**Say:**
"Heat is live, from weather data. The hottest day of the past year is there too, and what it means for an ordinary day."

## 1:20 – 1:50 · Check a property (the main feature)

**Show:** menu → **Check a property** → **Paste the listing** → **Try a sample** → **Check what they said**.
Pause on: "No flooding problem in this street" → **Doesn't match the record** → five flood years.
Scroll to the verdict and the questions to ask.

**Say:**
"This is the part I care about. Paste a broker's message. It reads the area and the floor, checks every claim against the record, and tells you what to ask before you pay the advance. It never says don't live here. It shows what happened and lets you ask."

## 1:50 – 2:05 · Compare + water (quick)

**Show:** **Compare two flats**: Velachery ground floor vs Tambaram ground floor. Scroll the three rows fast, stop on "What we don't know".
Then **Will your water last?**: change the cut to 6 days, watch it turn from short to critical.

**Say:**
"Compare two flats on flooding, heat and water, same measure, same period, with what's still unknown. And if a supply cut is announced, it works out how many days your water lasts."

## 2:05 – 2:40 · Where AWS fits (AWS console, on screen)

**Show, in this order:**
1. **Amplify** console: the `chennai-unsaid` app, the `main` branch, the domain. (Amplify Hosting)
2. **DynamoDB** → Tables → **FloodRecords** → **Explore table items**. Scroll real rows: locality, date, source_url.
3. **Bedrock** → Model catalog → **Amazon Nova Lite**. Then a terminal running `npm run extract` on one article, records printing out.

**Say:**
"Amazon Bedrock with Nova Lite read 190 Chennai news articles and pulled out the flood records. Then it checked each one again, and threw out anything that wasn't a real flood. DynamoDB holds the records, heat ratings and residents' reports. The site runs on Amplify Hosting, and it reaches DynamoDB and Bedrock through an IAM role, so there are no keys in the code."

## 2:40 – 2:55 · Honest limits + end card

**Say:**
"It works at neighbourhood level, not street level, and no record doesn't mean no risk. The app says that on every page. Built for Chennai, but the method works for any Indian city."

**End card (3 seconds):** Chennai Unsaid · main.d1v8v4f0epo1xy.amplifyapp.com · github.com/tanishkabhatera-bit/chennai-unsaid · your name

---

## Recording tips

- **Tool:** OBS Studio (free) or the Windows Snipping Tool's screen record. Record the face part on your phone.
- **Browser zoom 110–125%** so text is readable on YouTube. Close other tabs. Turn off notifications.
- **Rehearse twice** with a timer. Each block above has a time; if you run long, cut Compare + water to 10 seconds.
- **Record in pieces**, one per block, then join them (Clipchamp is free on Windows). Retakes are easier.
- **Before recording AWS:** open the DynamoDB table and Bedrock pages in tabs first, so there's no loading on camera. Don't show any keys or account settings.
- **Upload to YouTube as Unlisted.** Open the link in a private/incognito window to check it plays signed out. Check the length shows under 3:00.
- Title: "Chennai Unsaid · Environmental Hacks (Heat and Water)".
