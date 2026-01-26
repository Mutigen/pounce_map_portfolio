# Make.com Scenario B: JSON Feed Generator

## Purpose
Generate a clean, optimized JSON feed from Airtable for the frontend map to consume. Runs daily at 5:00 AM or manually via "Push to Map" button.

---

## Flow Diagram

```
[Trigger: Schedule 5AM OR Manual Webhook]
          ↓
[Search Airtable: "For JSON Export" View]
          ↓
[Iterator: For Each Lead]
          ↓
[Transform to JSON Object]
          ↓
[Array Aggregator: Collect All]
          ↓
[JSON > Create JSON]
          ↓
[Upload to Make.com Data Store / CDN]
          ↓
[Return Public URL]
          ↓
[Update Airtable: Last_JSON_Refresh timestamp]
```

---

## Modules Breakdown

### 1. Trigger: Schedule + Webhook

#### Schedule Trigger
**Module:** Tools > Schedule
**Cron:** `0 5 * * *` (5:00 AM daily, local time)
**Timezone:** America/New_York (Jacksonville)

#### Manual Trigger
**Module:** Webhooks > Custom Webhook
**URL:** `https://hook.us1.make.com/xxxxx` (unique webhook URL)
**Method:** GET or POST

**Implementation:**
- Add Button field in Airtable "Settings" table
- Button URL: Webhook URL
- Label: "🔄 Push to Map Now"

---

### 2. Search Airtable
**Module:** Airtable > Search Records
**Base:** Pounce Map - Leads Database
**Table:** Leads
**View:** "For JSON Export"

**Why use View:**
- Pre-filtered for `Lead_Status = "Active"`
- Pre-filtered for valid `Lat` and `Lng`
- Excludes dead leads and bad coordinates
- Optimized query performance

**Max Records:** 5000 (adjust if needed)
**Sort:** None (map will handle sorting client-side)

---

### 3. Iterator
**Module:** Flow Control > Iterator
**Input:** Array from Airtable search
**Purpose:** Process each lead individually

---

### 4. Transform to JSON Object
**Module:** Tools > Set Multiple Variables

**Output Structure:**
```json
{
  "id": "{{3.Household_ID}}",
  "lat": {{parseNumber(3.Lat)}},
  "lng": {{parseNumber(3.Lng)}},
  "score": {{3.Total_Score}},
  "display_score": "{{if(3.Total_Score > 99, '99+', 3.Total_Score)}}",
  "color": "{{3.Pin_Color}}",
  "badge": "{{3.Badge_Letter}}",
  "address": "{{3.Property_Address}}",
  "city": "{{3.City}}",
  "state": "{{3.State}}",
  "zip": "{{3.ZIP}}",
  "mailing_address": "{{3.Mailing_Address}}",
  "phone": "{{3.Phone}}",
  "tags": [
    {{if(3.Deceased, '"Deceased"', '')}},
    {{if(3.Tax_Auction, '"Tax Auction"', '')}},
    {{if(3.Probate, '"Probate"', '')}},
    {{if(3.Vacant, '"Vacant"', '')}},
    {{if(3.Distressed, '"Distressed"', '')}},
    {{if(3.D4D, '"D4D"', '')}},
    {{if(3.Utility_Shutoff, '"Utility Shutoff"', '')}},
    {{if(3.Code_Violation, '"Code Violation"', '')}}
  ],
  "auction_date": "{{3.Auction_Date}}",
  "days_until_auction": {{if(3.Days_Until_Auction, 3.Days_Until_Auction, null)}},
  "ghl_contact_id": "{{3.GHL_Contact_ID}}",
  "active_phone_index": {{3.Active_Phone_Index}},
  "last_note_date": "{{3.Last_Note_Date}}"
}
```

**Data Type Conversions:**
- `lat`, `lng`: Ensure numbers (parseNumber)
- `tags`: Array of strings (filter out blanks)
- `days_until_auction`: Number or null

---

### 5. Array Aggregator
**Module:** Tools > Array Aggregator
**Source Module:** Transform (Module 4)
**Purpose:** Collect all transformed objects into single array

**Output:** Array of all lead objects

---

### 6. Create JSON
**Module:** JSON > Create JSON
**Input:**
```json
{
  "generated_at": "{{formatDate(now, 'YYYY-MM-DD HH:mm:ss')}}",
  "total_leads": {{length(5.array)}},
  "leads": {{5.array}}
}
```

**Output:** Single JSON string ready for hosting

---

### 7. Upload to Storage

#### Option A: Make.com Data Store (Recommended)
**Module:** Data Store > Add/Update a Record
**Data Store:** `pounce-map-json-feed`
**Key:** `latest`
**Value:** `{{6.json}}`

**Public URL:** 
```
https://hook.us1.make.com/xxxxx/feeds/latest.json
```

**Pros:**
- Free (included in Make.com)
- Simple setup
- No external dependencies

**Cons:**
- 10MB file size limit
- Slower than CDN for global access

---

#### Option B: Cloudflare R2 / AWS S3
**Module:** HTTP > Make a Request
**Method:** PUT
**URL:** `https://r2.cloudflare.com/bucket/pounce-map/leads.json`
**Headers:**
```
Authorization: Bearer {{api_key}}
Content-Type: application/json
```
**Body:** `{{6.json}}`

**Public URL:**
```
https://pounce-map.r2.dev/leads.json
```

**Pros:**
- Fast CDN delivery
- No file size limits
- Better for 10k+ leads

**Cons:**
- Requires R2/S3 account
- Small monthly cost (~$0.01-0.50)

---

### 8. Update Metadata in Airtable
**Module:** Airtable > Update a Record
**Base:** Pounce Map - Leads Database
**Table:** Settings (single-row table)
**Record ID:** `recXXXXXXXXXX`

**Fields to Update:**
```json
{
  "Last_JSON_Refresh": "{{formatDate(now, 'YYYY-MM-DD HH:mm:ss')}}",
  "Total_Active_Leads": {{length(5.array)}},
  "JSON_URL": "{{7.public_url}}"
}
```

**Purpose:**
- Track when map was last updated
- Show lead count in Airtable dashboard
- Provide JSON URL for frontend reference

---

### 9. Cache Control Headers
**Important for Option B (CDN):**

When uploading to CDN, set headers:
```
Cache-Control: public, max-age=3600, s-maxage=3600
```

**Logic:**
- Browsers cache for 1 hour
- CDN caches for 1 hour
- Manual "Push to Map" invalidates cache immediately

---

## JSON Output Example

```json
{
  "generated_at": "2026-01-27 05:00:00",
  "total_leads": 2543,
  "leads": [
    {
      "id": "a3f5d8c9e4b7f6a2d1c8e9f4b7a6d5c3",
      "lat": 30.2672,
      "lng": -81.6557,
      "score": 95,
      "display_score": "95",
      "color": "red",
      "badge": "T",
      "address": "1209 Forbes St",
      "city": "Green Cove Springs",
      "state": "FL",
      "zip": "32043",
      "mailing_address": "456 Oak Ave, Atlanta, GA 30301",
      "phone": "904-555-0100",
      "tags": ["Tax Auction", "Vacant", "Probate"],
      "auction_date": "2026-01-29",
      "days_until_auction": 2,
      "ghl_contact_id": "ghl_abc123xyz",
      "active_phone_index": 1,
      "last_note_date": null
    },
    {
      "id": "b4g6e9d0f5c8g7b3e2d9f5c8b7d6e4d4",
      "lat": 30.3322,
      "lng": -81.6557,
      "score": 60,
      "display_score": "60",
      "color": "purple",
      "badge": "V",
      "address": "789 Elm Rd",
      "city": "Jacksonville",
      "state": "FL",
      "zip": "32210",
      "mailing_address": null,
      "phone": null,
      "tags": ["Vacant"],
      "auction_date": null,
      "days_until_auction": null,
      "ghl_contact_id": "ghl_def456uvw",
      "active_phone_index": 0,
      "last_note_date": "2026-01-20"
    }
  ]
}
```

---

## Performance Optimization

### File Size Management
**2,000 leads ≈ 1.2 MB JSON**
**10,000 leads ≈ 6 MB JSON**

**If exceeding limits:**
1. Remove unnecessary fields (mailing_address if not used on map)
2. Shorten field names (`addr` instead of `address`)
3. Split into regional JSON files (JAX North, JAX South, etc.)

### Execution Time
- 2,000 records: ~3-5 minutes
- 5,000 records: ~8-12 minutes

**Make.com Timeout:** 40 minutes (should be fine)

---

## Testing Checklist

- [ ] Run scenario manually via webhook
- [ ] Verify JSON file created/updated
- [ ] Check JSON structure (valid format, no syntax errors)
- [ ] Verify all active leads present (count matches Airtable)
- [ ] Test frontend can fetch and parse JSON
- [ ] Verify "Last_JSON_Refresh" updated in Airtable
- [ ] Test scheduled 5AM trigger (check logs next morning)
- [ ] Test with 100, 500, 2000 leads (performance validation)

---

## Error Handling

**If Airtable Search Fails:**
- Retry 3 times with 30-second delay
- Send alert to Slack/Email
- Do NOT overwrite existing JSON with blank data

**If Upload Fails:**
- Keep retrying until success
- Log error details to Airtable "System_Logs" table
- Alert developer

---

## Monitoring

**Daily Health Check:**
- Verify `Last_JSON_Refresh` timestamp is recent
- Check `Total_Active_Leads` count is reasonable
- Test JSON URL loads successfully

**Weekly:**
- Review Make.com operation logs
- Check for any failed executions
- Validate JSON file size trend

---

## Manual Refresh Instructions for Client

1. Open Airtable base
2. Go to "Settings" table
3. Click "🔄 Push to Map Now" button
4. Wait 2-5 minutes (depending on lead count)
5. Refresh map in browser (Cmd+R or Ctrl+R)
6. New data should appear

**Use Cases:**
- Just imported urgent auction leads
- Fixed data errors (wrong addresses, etc.)
- Updated GHL phone rotation
