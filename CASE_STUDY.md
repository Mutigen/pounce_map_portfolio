# Case Study: Pounce Map

**Mobile field tool for real estate lead management**
**Role:** Solo developer (full-stack + integration)
**Stack:** TypeScript · Vite · Google Maps JS API · Make.com · Airtable · GoHighLevel · Vercel

---

## The Problem

A real estate investing team runs "Driving for Dollars" campaigns — field agents drive through neighborhoods identifying distressed properties, import leads via DealMachine, and get followed up by automated SMS outreach through GoHighLevel (GHL).

The critical gap: once a field agent physically visits a property and logs a note, the automated SMS to that contact should stop *immediately*. With no real-time bridge between field activity and the CRM, contacts kept receiving automated messages even after a human had already engaged them — damaging conversion rates and reputation.

Additionally, with 2,000+ leads across Jacksonville, FL, there was no way to visualize the pipeline spatially. Agents had no way to see which properties were highest priority or closest to their current location.

---

## The Solution

I built **Pounce Map** — a mobile-first PWA that puts the entire lead database on an interactive Google Map with a one-tap kill switch.

**How it works:**

1. Leads flow from DealMachine → Make.com (CSV ingest) → Airtable (dedup + geocoding + Heat Score)
2. Make.com generates a JSON feed every 5 minutes
3. The map renders 2,000+ leads as color-coded paddle pins with clustering
4. Field agent taps a pin → bottom sheet shows contact info + Heat Score
5. Agent taps **LOG NOTE** → Airtable form opens (prefilled) + kill switch fires to GHL in <10 seconds

---

## Key Technical Decisions

### Heat Score Pin System
Rather than a flat list, leads are ranked by a multi-factor Heat Score (auction proximity, equity, tax status, data completeness). Five color tiers with priority override logic ensure field agents always see the highest-value properties first.

| Color | Condition |
|---|---|
| Flash (pulsing) | Auction within 7 days |
| Purple | Score ≥ 50 + missing contact data |
| Red | Score ≥ 80 |
| Orange | Score 50–79 |
| Blue | Score < 50 |

### GHL Kill Switch Architecture
The kill switch (Make.com Scenario C) was the hardest part to get right. The constraint: <10 second response from LOG NOTE tap to SMS halt in GHL. Achieved by:
- Firing the webhook **fire-and-forget** (non-blocking, retries up to 3x in background)
- Direct GHL API tag application (no intermediate steps)
- Parallel Airtable form open (doesn't block the webhook)

### Performance with 2,000+ Markers
Google Maps AdvancedMarkerElement + `@googlemaps/markerclusterer` with tuned `gridSize` and `maxZoom`. SVG paddle pins are generated once and cached per color/score/badge combination — no DOM thrashing on re-render.

### PWA + Mobile-First
The app is installed on agents' home screens. Offline tile caching via Workbox means the map loads even in areas with spotty coverage. Deep links route directly to Google Maps (iOS) or Google Maps (Android) based on user agent.

---

## Results

- **<10 second kill switch** response time consistently achieved
- **2,000+ pins** rendered with smooth clustering at all zoom levels
- **Zero exposed API credentials** — all config via Vercel environment variables
- Installable on iOS and Android as a PWA, no App Store needed

---

## What I Learned

- Make.com is powerful for no-code automation but requires careful error handling at the webhook layer — I added retry logic on the frontend as a safety net
- Google Maps AdvancedMarkerElement is the future (replaces deprecated Marker API) but documentation gaps required diving into the source
- Designing for field use means designing for one-handed operation, sunlight, and gloves — minimum tap targets, high contrast, no hover states

---

## Links

- **Live Demo:** [pounce-map-portfolio.vercel.app](https://pounce-map-portfolio.vercel.app) *(sample data, no real leads)*
- **GitHub:** [github.com/Mutigen/pounce_map_portfolio](https://github.com/Mutigen/pounce_map_portfolio)
- **Built by:** Levan (alias Mamiko) · [github.com/Mutigen](https://github.com/Mutigen)
