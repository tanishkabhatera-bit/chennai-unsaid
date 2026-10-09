# Brief for the SEO blog chat (paste this in)

Write a blog post for my own website about a project I built. Use my voice rules (brain imprint + kill list). Learner mode, first person, short lines, points over paragraphs, no em dashes, no buzzwords, no invented numbers. Only use the facts below.

**Primary keyword:** chennai flood areas before renting
**Secondary:** chennai flood prone areas, which areas flood in chennai, chennai rent flooding, velachery flooding history, chennai heat by area
**Audience:** people in Chennai about to rent or buy a flat, and small business owners who read my blog
**Angle:** I'm a digital marketing student, not a developer. I built a free tool in 4 days for a hackathon. Here's what it does and what I learned. Link to the live tool.

## Facts you may use (all true)

- Project: Chennai Unsaid, built for Environmental Hacks (Bharat Builds Tour, WeMakeDevs × AWS), 8–11 October 2026, Heat and Water track.
- Live: https://main.d1v8v4f0epo1xy.amplifyapp.com
- Why: I fainted from the heat in Chennai once. Nobody tells you how hot an area gets or whether it floods before you move in.
- After Cyclone Michaung (Dec 2023), news reported water standing about a week in parts of Pallikaranai, Thoraipakkam, Kodungaiyur and Valasaravakkam.
- The tool covers 202 Chennai areas. Flood history from 190 news articles (DT Next, Deccan Herald, Citizen Matters, 2015–2026). 304 confirmed flood records across 82 areas.
- AI (Amazon Bedrock, Nova Lite) read the articles and extracted records, then checked each one a second time. 81 of 190 articles were feature/opinion pieces, not flood reports.
- A mistake I caught: it showed Velachery flooding in 2026 because a 2026 election article mentioned the 2015 floods. Fixed with a look-back check.
- Features: flood history per area by year with the source article; live heat and hottest day of the past year; Check a property (paste a broker's message, it checks the claims); Compare two flats; Will your water last (supply cut calculator using 135 L/person/day CPHEEO norm and 15 L Sphere minimum).
- Example: a sample listing said "No flooding problem in this street" for Velachery; the record shows five flood years.
- Limits: area level not street level; no record does not mean no risk; rain data on a ~10 km grid; no official water supply data yet.
- Built with Claude Code. Hosted on AWS Amplify; data in DynamoDB.

## Do not

- Do not claim numbers not listed above.
- Do not say any area is "safe" or "avoid this area".
- Do not name any landlord, broker or person.
- Do not pitch services in this post (learner post). The tool link is fine.

## Internal links to add on my site

- My Google Business Profile / local SEO posts, where relevant.
- Link to the live tool and the GitHub repo.
