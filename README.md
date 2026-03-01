# Pounce Map v2.3.1

Mobile-first field map for real estate lead management — built for Driving for Dollars workflows.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pounce--map--portfolio.vercel.app-000000?style=flat&logo=vercel&logoColor=white)](https://pounce-map-portfolio.vercel.app)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat&logo=vite&logoColor=white)
![Google Maps](https://img.shields.io/badge/Google%20Maps%20JS%20API-weekly-4285F4?style=flat&logo=googlemaps&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat&logo=pwa&logoColor=white)

> **This is the public portfolio version.** It runs in Demo Mode with sample leads — no real client data. See [CASE_STUDY.md](./CASE_STUDY.md) for the full project writeup.

![Pounce Map Preview](./public/preview.png)

---

## Overview

Pounce Map renders 2000+ real estate leads as interactive paddle pins on a Google Map, color-coded by a Heat Score system. Field agents open the app on mobile, tap a pin, and can navigate directly to the property or log a note — triggering a GHL kill switch that stops automated SMS outreach within 10 seconds.

**Data flow:** DealMachine → Make.com → Airtable → JSON feed → Map

**Demo mode:** When `VITE_JSON_FEED_URL` is not set, the app automatically loads `/demo-data.json` (15 sample leads). Kill switch and Airtable form are disabled in demo mode.

---

## Features

- **Heat Score pins** — color-coded by urgency (flash / purple / red / orange / blue)
- **Marker clustering** — smooth performance with 2000+ pins
- **Bottom sheet** — swipeable property detail panel (iOS Maps-style)
- **Navigate button** — deep links to Google Maps / Apple Maps
- **Log Note button** — prefills Airtable form + fires GHL kill switch
- **PWA** — installable on iOS and Android, works offline with cached tiles
- **Auto-refresh** — pulls fresh lead data every 5 minutes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript, Vite, PWA (Workbox) |
| Maps | Google Maps JavaScript API (AdvancedMarkerElement) |
| Data | Make.com JSON feed via webhook |
| CRM | GoHighLevel (kill switch via tag) |
| Forms | Airtable (prefilled form via URL params) |
| Deployment | Vercel |

---

## Project Structure

```
pounce-map/
├── src/
│   ├── main.ts              # App entry point
│   ├── types.ts             # TypeScript interfaces
│   ├── config.ts            # Environment config
│   ├── data.ts              # JSON feed fetching & transformation
│   ├── map.ts               # Google Maps initialization
│   ├── markers.ts           # Marker rendering & clustering
│   ├── pins.ts              # SVG paddle pin generation (cached)
│   ├── bottom-sheet.ts      # Swipeable property detail panel
│   ├── contacts.ts          # Contact card rendering
│   ├── log-note.ts          # Kill switch & Airtable form
│   ├── deep-links.ts        # iOS/Android navigation deep links
│   ├── location.ts          # Geolocation
│   └── utils.ts             # Helpers (log, debounce, escapeHtml)
├── styles/
│   ├── main.css
│   └── bottom-sheet.css
├── public/
│   ├── favicon.svg
│   ├── icon-192.svg
│   └── icon-512.svg
├── airtable/                # Airtable schema & formulas reference
├── backend/                 # Make.com scenario documentation
├── .env.example             # Environment variable template
├── vite.config.ts
├── tsconfig.json
└── vercel.json
```

---

## Deployment (Vercel)

### Demo deployment (portfolio / no client data)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import this repository
2. Set **only** the Google Maps variables:

| Variable | Description |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS API key (restrict to your Vercel domain) |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps Map ID (required for AdvancedMarkerElement) |

Leave `VITE_JSON_FEED_URL`, `VITE_MAKE_WEBHOOK_URL`, and `VITE_AIRTABLE_FORM_URL` **empty** — the app will run in Demo Mode automatically.

### Production deployment (with live client data)

| Variable | Description |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps Map ID (required for AdvancedMarkerElement) |
| `VITE_JSON_FEED_URL` | Make.com Scenario B webhook URL (JSON feed) |
| `VITE_MAKE_WEBHOOK_URL` | Make.com Scenario C webhook URL (GHL kill switch) |
| `VITE_AIRTABLE_FORM_URL` | Airtable form base URL (Log Note prefill) |

See `.env.example` for reference.

Vercel builds automatically on every push to `main`. Manual deploy:

```bash
npm run build
```

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# → Fill in your API keys in .env.local

# Start dev server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## Heat Score Color Logic

Priority order (highest overrides all):

| Color | Condition |
|---|---|
| 🟠 Flash (pulsing) | Auction within 7 days |
| 🟣 Purple | Score ≥ 50 + missing phone or address |
| 🔴 Red | Score ≥ 80 |
| 🟡 Orange | Score 50–79 |
| 🔵 Blue | Score < 50 |

---

## Backend Documentation

- [`backend/scenario-a-import.md`](backend/scenario-a-import.md) — Make.com CSV ingest
- [`backend/scenario-b-json.md`](backend/scenario-b-json.md) — JSON feed generation
- [`backend/scenario-c-ghl.md`](backend/scenario-c-ghl.md) — GHL kill switch
- [`airtable/schema.json`](airtable/schema.json) — Airtable base schema
- [`airtable/formulas.md`](airtable/formulas.md) — Heat Score formulas

---

## Built by

**Levan (alias Mamiko) by MUT-i-GEN**
GitHub: [@Mutigen](https://github.com/Mutigen)

---

**[→ Live Demo](https://pounce-map-portfolio.vercel.app) · [→ Case Study](./CASE_STUDY.md)**
