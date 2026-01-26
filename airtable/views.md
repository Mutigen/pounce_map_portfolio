# Airtable Views - Pounce Map

## Leads Table Views

### 1. All Active Leads
**Purpose:** Default working view
**Filter:** `{Lead_Status} = "Active"`
**Sort:** None (default order)
**Fields Visible:** All standard fields

---

### 2. Hot Leads (80+)
**Purpose:** Priority leads with highest scores
**Filter:** `AND({Total_Score} >= 80, {Lead_Status} = "Active")`
**Sort:** `{Total_Score}` descending
**Fields Visible:**
- Household_ID
- Property_Address
- Total_Score
- Pin_Color
- Badge_Letter
- Phone
- GHL_Contact_ID
- Last_Note_Date

**Use Case:** Quick view of highest-priority targets for cold calling or immediate pounce

---

### 3. Auction Alert (<7 days)
**Purpose:** Time-sensitive leads with upcoming auctions
**Filter:** 
```
AND(
  {Days_Until_Auction} <= 7,
  {Days_Until_Auction} >= 0,
  {Lead_Status} != "Sold",
  {Lead_Status} != "Dead"
)
```
**Sort:** `{Days_Until_Auction}` ascending (most urgent first)
**Color Coding:** Red background for 0-3 days
**Fields Visible:**
- Property_Address
- Auction_Date
- Days_Until_Auction
- Total_Score
- Phone
- Last_Note_Date

**Use Case:** Daily monitoring of auction deadlines - these get flash pins on map

---

### 4. Data Gaps
**Purpose:** High-value leads missing critical contact info
**Filter:** `{Data_Gap} = TRUE()`
**Sort:** `{Total_Score}` descending
**Fields Visible:**
- Property_Address
- Total_Score
- Phone (highlighted if blank)
- Mailing_Address (highlighted if blank)
- Deceased
- Tax_Auction
- Vacant

**Use Case:** VA task list - research missing phone numbers or addresses for purple pins

---

### 5. For JSON Export
**Purpose:** Clean dataset for Make.com Scenario B
**Filter:** 
```
AND(
  {Lead_Status} = "Active",
  {Lat} != BLANK(),
  {Lng} != BLANK()
)
```
**Sort:** None
**Fields Visible:** All fields needed for map rendering
**Hidden Fields:** Internal tracking fields not needed by frontend

**Use Case:** 
- Make.com reads from this view to generate JSON feed
- Excludes dead leads and invalid coordinates
- Ensures only map-ready data is exported

---

### 6. Dead/DNC
**Purpose:** Archive of disqualified leads
**Filter:** `{Lead_Status} = "Dead"`
**Sort:** `{Last_Modified}` descending
**Fields Visible:**
- Property_Address
- Last_Note_Date
- Notes (from Field_Notes)
- Reason (why marked dead)

**Use Case:** 
- Historical record of why leads were disqualified
- Prevents re-import if they appear in new lists
- GHL should also have "status-engaged" tag

---

## Field_Notes Table Views

### 1. Recent Notes
**Default View**
**Sort:** `{Timestamp}` descending
**Group By:** `{Note_Type}`
**Fields Visible:** All

**Use Case:** See all field activity chronologically

---

### 2. Left Note (Follow-up Required)
**Filter:** `{Note_Type} = "Left Note"`
**Sort:** `{Timestamp}` descending
**Fields Visible:**
- Lead (linked)
- Property_Address (lookup)
- Photo
- Timestamp
- Days Since Note (formula)

**Use Case:** Track which properties need follow-up after door hangers

---

### 3. Spoke to Owner
**Filter:** `{Note_Type} = "Spoke to Owner"`
**Sort:** `{Timestamp}` descending

**Use Case:** Leads that converted to conversations - handoff to GHL nurture sequence

---

## View Management

### When to Add New Views
- Client requests specific filtering needs
- Performance analysis requires specialized data slice
- VA tasks need dedicated workspace

### View Permissions
- **All Views:** Client and VA have edit access
- **For JSON Export:** Make.com has read-only API access
- **Hot Leads:** Could be shared with cold calling team

### Performance Notes
- Views with complex filters (nested ANDs/ORs) may slow on 10k+ records
- Group By should be used sparingly on large datasets
- Linked record lookups add query overhead
