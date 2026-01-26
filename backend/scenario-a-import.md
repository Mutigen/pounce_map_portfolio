# Make.com Scenario A: CSV Import & Household Deduplication

## Purpose
Ingest lead lists from multiple sources (Vacant, Tax, Probate, etc.) and upsert into Airtable with deduplication logic to ensure one property = one pin.

---

## Flow Diagram

```
[CSV Upload Trigger / Webhook]
          ↓
[Parse CSV to Array]
          ↓
[Iterator: For Each Row]
          ↓
[Text Operations: Normalize Address]
          ↓
[Generate Household_ID (MD5 Hash)]
          ↓
[Search Airtable by Household_ID]
          ↓
    [Record Exists?]
      /          \
    YES          NO
     ↓            ↓
[Update]    [Create New]
     ↓            ↓
[Merge Tags]  [Set All Fields]
     ↓            ↓
[Add Points]     ↓
     ↓            ↓
    [Log Success]
          ↓
[Aggregator: Count Total Processed]
          ↓
[Send Summary Email/Slack]
```

---

## Modules Breakdown

### 1. Trigger: Watch Files / Webhook
**Options:**
- **Option A:** Google Drive "Watch Files" - Monitor specific folder for new CSVs
- **Option B:** Custom Webhook - Direct upload endpoint
- **Option C:** Scheduled - Poll Airtable upload table daily

**Recommended:** Option A (Google Drive integration)
**Why:** Client likely already organizing CSVs in Drive

**Settings:**
- Folder: `/Pounce Map/Imports/`
- File type: `.csv`
- Trigger: On new file creation

---

### 2. CSV Parser
**Module:** CSV > Parse CSV
**Input:** File content from trigger
**Settings:**
- Delimiter: `,` (comma)
- Contains headers: `YES`
- Number of columns: Auto-detect

**Output:** Array of row objects with column headers as keys

---

### 3. Iterator
**Module:** Flow Control > Iterator
**Input:** Array from CSV Parser
**Purpose:** Process each lead one at a time

---

### 4. Text Operations: Normalize Address
**Module:** Text Parser > Replace
**Purpose:** Standardize address formats for consistent hashing

**Replacements:**
```
"Street" → "St"
"Avenue" → "Ave"
"Boulevard" → "Blvd"
"Drive" → "Dr"
"Road" → "Rd"
"  " → " " (double space to single)
UPPERCASE all text
Trim whitespace
```

**Input Field:** `Property_Address` from iterator
**Output Variable:** `normalized_address`

---

### 5. Generate Household_ID
**Module:** Tools > Set Variable
**Formula:** 
```
{{md5(toLower(concat(4.normalized_address, 4.ZIP)))}}
```

**Logic:**
- Concatenate normalized address + ZIP code
- Convert to lowercase
- Hash with MD5 to create unique identifier

**Example:**
```
Input: "123 Main Street, Jacksonville, 32259"
Normalized: "123 MAIN ST"
ZIP: "32259"
Hash Input: "123 main st32259"
Household_ID: "a3f5d8c9e4b7f6a2d1c8e9f4b7a6d5c3"
```

---

### 6. Search Airtable
**Module:** Airtable > Search Records
**Base:** Pounce Map - Leads Database
**Table:** Leads
**Search Formula:**
```
{Household_ID} = '{{5.household_id}}'
```

**Max Records:** 1
**Output:** 
- If found: Record ID + all field values
- If not found: Empty array

---

### 7. Router: Exists vs New

**Module:** Flow Control > Router
**Routes:**

#### Route 1: Record EXISTS
**Filter:** `{{6.id}}` is not empty
**Action:** Update Record

#### Route 2: Record NEW
**Filter:** `{{6.id}}` is empty
**Action:** Create Record

---

### 8A. Update Existing Record
**Module:** Airtable > Update a Record
**Record ID:** `{{6.id}}` from search

**Field Mapping (Merge Logic):**

```javascript
// ONLY update if new value is not blank
{
  "Deceased": {{if(4.Deceased != "", 4.Deceased, 6.Deceased)}},
  "Tax_Auction": {{if(4.Tax_Auction != "", 4.Tax_Auction, 6.Tax_Auction)}},
  "Vacant": {{if(4.Vacant != "", 4.Vacant, 6.Vacant)}},
  "Distressed": {{if(4.Distressed != "", 4.Distressed, 6.Distressed)}},
  "Utility_Shutoff": {{if(4.Utility_Shutoff != "", 4.Utility_Shutoff, 6.Utility_Shutoff)}},
  "D4D": {{if(4.D4D != "", 4.D4D, 6.D4D)}},
  "Probate": {{if(4.Probate != "", 4.Probate, 6.Probate)}},
  "Code_Violation": {{if(4.Code_Violation != "", 4.Code_Violation, 6.Code_Violation)}},
  
  // Always update if new data provided
  "Mailing_Address": {{if(4.Mailing_Address != "", 4.Mailing_Address, 6.Mailing_Address)}},
  "Phone": {{if(4.Phone != "", 4.Phone, 6.Phone)}},
  "Owner_Distance": {{if(4.Owner_Distance != "", 4.Owner_Distance, 6.Owner_Distance)}},
  "Auction_Date": {{if(4.Auction_Date != "", 4.Auction_Date, 6.Auction_Date)}},
  
  // Never overwrite these
  "GHL_Contact_ID": {{6.GHL_Contact_ID}},
  "Active_Phone_Index": {{6.Active_Phone_Index}},
  "Last_Note_Date": {{6.Last_Note_Date}},
  "Attempt_Count": {{6.Attempt_Count}}
}
```

**Logic:**
- Checkboxes: Add new motivations (OR logic, don't remove existing)
- Contact info: Update if new data provided, keep old if blank
- GHL fields: NEVER overwrite (managed by Scenario C)

---

### 8B. Create New Record
**Module:** Airtable > Create a Record

**Field Mapping:**
```json
{
  "Household_ID": "{{5.household_id}}",
  "Property_Address": "{{4.Property_Address}}",
  "Mailing_Address": "{{4.Mailing_Address}}",
  "City": "{{4.City}}",
  "State": "{{4.State}}",
  "ZIP": "{{4.ZIP}}",
  "Lat": "{{4.Lat}}",
  "Lng": "{{4.Lng}}",
  "Deceased": "{{4.Deceased}}",
  "Tax_Auction": "{{4.Tax_Auction}}",
  "Probate": "{{4.Probate}}",
  "Vacant": "{{4.Vacant}}",
  "Distressed": "{{4.Distressed}}",
  "Utility_Shutoff": "{{4.Utility_Shutoff}}",
  "D4D": "{{4.D4D}}",
  "Code_Violation": "{{4.Code_Violation}}",
  "Owner_Distance": "{{4.Owner_Distance}}",
  "Auction_Date": "{{4.Auction_Date}}",
  "Phone": "{{4.Phone}}",
  "Lead_Status": "Active",
  "Attempt_Count": 0
}
```

**Defaults:**
- Lead_Status: "Active" (all new leads start active)
- Attempt_Count: 0
- GHL fields: Leave blank (will be populated when contact is created in GHL)

---

### 9. Geocoding (Conditional)
**Module:** Google Maps > Geocode an Address
**Trigger Condition:** 
```
{{if(or(4.Lat = "", 4.Lng = ""), true, false)}}
```

**Only runs if:** Lat OR Lng is blank in CSV

**Input:** `{{4.Property_Address}}, {{4.City}}, {{4.State}} {{4.ZIP}}`

**Output:** 
- Update Airtable record with `Lat` and `Lng`

**Cost Control:**
- Only triggers when coordinates are missing
- Uses Google Nonprofit credits ($250/month)
- ~$0.005 per geocode

---

### 10. Error Handler
**Module:** Tools > Error Handler
**Scope:** Entire scenario

**Actions on Error:**
1. Log to Airtable "Import_Errors" table:
   - Row data that failed
   - Error message
   - Timestamp
2. Continue processing (don't halt entire import)

---

### 11. Aggregator
**Module:** Tools > Array Aggregator
**Purpose:** Count total records processed

**Output:**
- Total rows: `{{count()}}`
- Created: `{{count(route2)}}`
- Updated: `{{count(route1)}}`
- Errors: `{{count(errors)}}`

---

### 12. Notification
**Module:** Slack > Send a Message / Email > Send an Email

**Message Template:**
```
✅ CSV Import Complete

File: {{1.name}}
Total Rows: {{11.total}}
Created: {{11.created}} new leads
Updated: {{11.updated}} existing leads
Errors: {{11.errors}}

Next Step: Review "Data Gaps" view in Airtable for missing info.
```

---

## CSV Format Requirements

### Required Columns
- `Property_Address`
- `ZIP`

### Optional Columns
- `Mailing_Address`
- `City`
- `State`
- `Lat`, `Lng`
- `Phone`
- `Deceased` (TRUE/FALSE or 1/0)
- `Tax_Auction` (TRUE/FALSE or 1/0)
- `Probate` (TRUE/FALSE or 1/0)
- `Vacant` (TRUE/FALSE or 1/0)
- `Distressed` (TRUE/FALSE or 1/0)
- `Utility_Shutoff` (TRUE/FALSE or 1/0)
- `D4D` (TRUE/FALSE or 1/0)
- `Code_Violation` (TRUE/FALSE or 1/0)
- `Owner_Distance` (number)
- `Auction_Date` (YYYY-MM-DD format)

### Example CSV
```csv
Property_Address,City,State,ZIP,Lat,Lng,Vacant,Tax_Auction,Phone
123 Main St,Jacksonville,FL,32259,30.2672,-81.6557,TRUE,FALSE,904-555-0100
456 Oak Ave,Jacksonville,FL,32210,,,TRUE,TRUE,
```

---

## Testing Checklist

- [ ] Upload CSV with 10 test rows
- [ ] Verify all 10 created in Airtable
- [ ] Upload same CSV again
- [ ] Verify 0 created, 10 updated (deduplication working)
- [ ] Upload CSV with 5 new + 5 existing rows
- [ ] Verify 5 created, 5 updated
- [ ] Test with missing Lat/Lng (geocoding triggers)
- [ ] Test with malformed address (error handler catches)
- [ ] Verify notification sent after import

---

## Performance Notes

- **Execution Time:** ~2-3 seconds per row
- **100 rows:** ~3-5 minutes
- **1000 rows:** ~30-50 minutes
- **Make.com Limit:** 10,000 operations/month on Free tier

**Optimization:**
- Run imports overnight for large files
- Split 5k+ row CSVs into batches
