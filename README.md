# 🚀 Pounce Map v2.3.1

Mobile field map for real estate lead management - Jacksonville, FL

## 📋 Project Overview

High-performance mobile web application for "Driving for Dollars" - visualizing real estate leads with hybrid scoring logic (0-100 Heat Score + Context), merging data from multiple sources, and acting as manual override for GHL SMS outreach engine.

## 🏗️ Tech Stack

- **Backend**: Airtable (database), Make.com (automation)
- **Frontend**: Google Maps JavaScript API, Vanilla JS
- **Integration**: GoHighLevel API
- **Deployment**: Vercel
- **Data Source**: DealMachine (address normalization)

## 📦 Project Structure

```
pounce-map/
├── frontend/           # Google Maps Web App
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── backend/            # Make.com Scenario Documentation
│   ├── scenario-a-import.md
│   ├── scenario-b-json.md
│   └── scenario-c-ghl.md
├── airtable/          # Airtable Formulas & Schema
│   ├── schema.json
│   ├── formulas.md
│   └── views.md
├── docs/              # Documentation
│   ├── field-mapping-guide.md
│   ├── ghl-integration.md
│   └── deployment.md
└── test-data/
    └── clustering_test_data.json
```

## 🎯 Milestones

### Milestone 1: Backend Logic & GHL Integration (7 days) - $533.20
- Airtable base with Heat Score formulas (0-100)
- Household deduplication logic
- Make.com scenarios: data ingest, JSON feed, GHL kill switch
- GHL API integration validated (<10s response)

### Milestone 2: Frontend Map & Mobile UX (7 days) - $533.20
- Mobile-first Google Maps JS web app
- Custom paddle pins (score + color + badge)
- Marker clustering for 2000+ pins
- Auction flash animation
- Bottom-sheet popup with Navigate + Log Note

### Milestone 3: Integration Testing & Documentation (3 days) - $266.60
- End-to-end field workflow testing
- Deep-link validation (iOS/Android)
- GHL feedback loop verification
- Documentation & handoff

## 🚦 Getting Started

### Prerequisites
- Airtable workspace access
- Make.com account
- Google Maps API key
- GHL Location-level API key

### Setup
[Will be updated after client provides API access]

## 📞 Client: Jerrelle Williams
- Market Hub: 360 Bartram Market Dr, Jacksonville, FL 32259
- GHL Workflows to stop: Workflow 08 (Phone Rotator), Workflow 11 (No Reply Handler)
- Tag for kill switch: `status-engaged`

## 📝 License
Private project for client: Jerrelle Williams

# Pounce Map - Make.com Scenarios

## Scenario A: Data Ingest

**Webhook URL:** `https://hook.eu2.make.com/[webhook-id]`

### Expected Payload:
```json
{
  "leads": [
    {
      "address": "123 Main St, Jacksonville, FL 32218",
      "zip": "32218",
      "lat": 30.12345,
      "lng": -81.54321,
      "property_type": "Code Violation"
    }
  ]
}
```

### Testing:
```bash
curl -X POST https://hook.eu2.make.com/[webhook-id] \
  -H "Content-Type: application/json" \
  -d '{"leads": [...]}'
```
