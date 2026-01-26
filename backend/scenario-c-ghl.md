# Make.com Scenario C: GHL Kill Switch (<10s Response Time)

## Purpose
Instantly stop GHL SMS workflows when field note is logged. Must execute in <10 seconds to prevent text messages while user is on-site with property owner.

---

## Flow Diagram

```
[Airtable Form Submitted]
          ↓
[Instant Webhook Trigger]
          ↓
[Extract: GHL_Contact_ID, Note_Type]
          ↓
[HTTP Request: Add Tag to GHL Contact]
          ↓
[Update Airtable: Last_Note_Date]
          ↓
[Log Response Time]
```

---

## Critical Performance Requirements

⏱️ **Target:** <10 seconds end-to-end
⏱️ **Acceptable:** <15 seconds
⏱️ **Unacceptable:** >15 seconds (SMS may already be sent)

**Bottlenecks to Avoid:**
- ❌ No complex formulas or transformations
- ❌ No conditional routing (keep it linear)
- ❌ No external API calls besides GHL
- ❌ Minimal Airtable updates (only essentials)

---

## Modules Breakdown

### 1. Trigger: Instant Webhook
**Module:** Webhooks > Custom Webhook
**Type:** Instant (not polling!)
**Method:** POST
**Expected Payload:**
```json
{
  "household_id": "a3f5d8c9e4b7f6a2d1c8e9f4b7a6d5c3",
  "ghl_contact_id": "ghl_abc123xyz",
  "note_type": "Left Note",
  "photo_url": "https://airtable.com/...",
  "notes": "No answer, left door hanger",
  "timestamp": "2026-01-27 14:35:22"
}
```

**Webhook URL:**
```
https://hook.us1.make.com/xxxxxxxxxxxxx
```

**Configuration:**
- Response: JSON 200 OK immediately (don't wait for completion)
- Async: Process continues after response sent

---

### 2. GHL API: Add Tag
**Module:** HTTP > Make a Request
**Method:** POST
**URL:**
```
https://services.leadconnectorhq.com/contacts/{{1.ghl_contact_id}}/tags
```

**Headers:**
```json
{
  "Authorization": "Bearer {{ghl_api_key}}",
  "Content-Type": "application/json",
  "Version": "2021-07-28"
}
```

**Body:**
```json
{
  "tags": ["status-engaged"]
}
```

**Timeout:** 5 seconds
**Retry:** 2 attempts max (if timeout, don't keep retrying)

**Expected Response:**
```json
{
  "contact": {
    "id": "ghl_abc123xyz",
    "tags": ["status-engaged", "...other tags..."]
  }
}
```

---

### 3. Update Airtable (Essential Fields Only)
**Module:** Airtable > Update a Record
**Search By:** `Household_ID = {{1.household_id}}`

**Fields to Update:**
```json
{
  "Last_Note_Date": "{{1.timestamp}}",
  "Attempt_Count": "{{increment existing value}}"
}
```

**CRITICAL:**
- Do NOT update unnecessary fields
- Do NOT trigger cascading formula recalculations
- Keep this update minimal for speed

---

### 4. Log Response Time (Monitoring)
**Module:** Airtable > Create a Record
**Table:** System_Logs
**Fields:**
```json
{
  "Event_Type": "GHL_Kill_Switch",
  "Household_ID": "{{1.household_id}}",
  "GHL_Contact_ID": "{{1.ghl_contact_id}}",
  "Response_Time_Seconds": "{{duration}}",
  "Success": "{{if(2.status = 200, true, false)}}",
  "Timestamp": "{{now}}"
}
```

**Purpose:**
- Track actual response times
- Monitor GHL API health
- Alert if consistently >10s

---

## GHL API Configuration

### API Key Setup
**Location:** GHL Settings > API Keys
**Type:** Location-level API Key (NOT Agency-level)
**Permissions Required:**
- `contacts.write` (to add tags)
- `contacts.readonly` (to verify contact exists)

**Storage:**
- Store in Make.com Variables (encrypted)
- **NEVER** hardcode in scenario

---

### Tag Configuration in GHL

**Tag Name:** `status-engaged`
**Case Sensitive:** No
**Existing Tags:** Don't remove, just append

**Workflows That Should Stop When Tag Applied:**

#### Workflow 08: Phone Rotator
**Trigger:** Contact created OR phone number updated
**Filter:** Does NOT have tag `status-engaged`
**Action:** Rotate through phone list, send SMS

**Update Required:**
Add to existing filter:
```
AND Contact Tag does not contain "status-engaged"
```

#### Workflow 11: No Reply Handler
**Trigger:** 48 hours after last SMS, no reply
**Filter:** Does NOT have tag `status-engaged`
**Action:** Send follow-up SMS

**Update Required:**
Add to existing filter:
```
AND Contact Tag does not contain "status-engaged"
```

---

## Airtable Form Configuration

**Form URL:**
```
https://airtable.com/shrXXXXXXXXXX
```

**Prefilled Parameters (from map link):**
```
?prefill_Household_ID={id}
&prefill_GHL_Contact_ID={ghl_contact_id}
&prefill_Timestamp={now}
```

**Form Fields:**
1. **Household_ID** (hidden, prefilled)
2. **GHL_Contact_ID** (hidden, prefilled)
3. **Note_Type** (single select: "Spoke to Owner", "Left Note", "Dead / DNC")
4. **Photo** (attachment - photo of note/house)
5. **Notes** (long text - additional comments)
6. **Timestamp** (hidden, prefilled)

**Automation:**
- On form submit → Trigger Make.com webhook instantly
- Pass all form data as JSON payload

---

## Performance Optimization Techniques

### 1. Webhook Response Pattern
```javascript
// Make.com responds IMMEDIATELY (don't wait for GHL)
return {
  status: 200,
  body: { message: "Processing..." }
};

// Then continue with GHL API call asynchronously
```

**Benefit:** User sees instant confirmation, doesn't wait for backend

---

### 2. GHL API Request Optimization
**Keep payload minimal:**
```json
{
  "tags": ["status-engaged"]  // ONLY the tag, nothing else
}
```

**Don't fetch contact details first:**
- Skip GET /contacts/{id} before updating
- Just POST tag directly (faster)

---

### 3. Airtable Update Optimization
**Use direct Record ID if possible:**
```
If Household_ID → Record_ID mapping is cached in Make.com Data Store,
use Update by Record ID (faster than search + update)
```

**Alternative:**
Store Record_ID in form prefill alongside Household_ID

---

### 4. Network Routing
**Make.com Server Region:** US East (closest to Jacksonville, FL)
**GHL API Region:** Auto (managed by GHL)
**Airtable Region:** Auto (managed by Airtable)

**Minimize Hops:** All in same AWS region ideally

---

## Testing Protocol

### Latency Benchmarks

**Test Environment Setup:**
1. Create test contact in GHL
2. Create test lead in Airtable
3. Submit form from mobile phone (real-world conditions)

**Measurement Points:**
- T0: Form submitted (timestamp in browser)
- T1: Webhook received by Make.com (log entry)
- T2: GHL API response (HTTP module log)
- T3: Airtable updated (completion log)

**Target:**
- T1 - T0: <1 second
- T2 - T1: <5 seconds ⚠️ Critical
- T3 - T2: <3 seconds
- **Total (T3 - T0): <10 seconds** ✅

---

### Test Scenarios

#### Test 1: Optimal Conditions
- Good LTE/5G connection
- GHL API healthy (no load)
- Airtable API healthy
**Expected:** 3-5 seconds

#### Test 2: Poor Network
- Edge/3G connection
- Simulate with throttling
**Expected:** 8-12 seconds

#### Test 3: GHL API Slow
- Manually add 2-second delay to simulate GHL server load
**Expected:** 7-9 seconds

#### Test 4: Worst Case
- Poor network + GHL slow
**Expected:** 12-15 seconds (acceptable)

---

## Error Handling

### If GHL API Fails (timeout, 500 error, etc.)

**Immediate Action:**
1. Log error to Airtable System_Logs
2. Send Slack alert to developer
3. **Still update Airtable** (Last_Note_Date, Attempt_Count)

**Fallback:**
- Retry GHL tag in background (separate scenario)
- Manual tag application via GHL UI if urgent

**User Impact:**
- User sees "Note Saved" confirmation
- They don't know GHL sync failed
- Developer fixes async

---

### If Airtable Fails

**Less Critical:**
- GHL tag still applied (SMS stopped = primary goal)
- Airtable data loss is annoying but not breaking
- Can be manually re-entered later

---

## Monitoring & Alerts

### Daily Health Check
**Query System_Logs:**
```sql
SELECT AVG(Response_Time_Seconds) 
FROM System_Logs 
WHERE Event_Type = 'GHL_Kill_Switch'
  AND Timestamp >= NOW() - INTERVAL 24 HOURS
```

**Thresholds:**
- Average <8s: ✅ Healthy
- Average 8-12s: ⚠️ Investigate
- Average >12s: 🚨 Critical - needs optimization

---

### Real-Time Alerts
**Slack Notification if:**
- Single request >15 seconds
- 3+ failures in 1 hour
- GHL API returns 5xx error

**Message Template:**
```
⚠️ GHL Kill Switch Slow Response

Response Time: 17 seconds
Household: 1209 Forbes St
GHL Contact: ghl_abc123xyz
Time: 2026-01-27 14:35:22

Action: Check GHL API status
```

---

## Deployment Checklist

**Before Go-Live:**
- [ ] GHL API key validated (test API call succeeds)
- [ ] Webhook URL added to Airtable form automation
- [ ] Tag "status-engaged" created in GHL
- [ ] Workflow 08 and 11 filters updated
- [ ] Test form submission from mobile (actual iPhone)
- [ ] Measure response time (confirm <10s)
- [ ] Error handler tested (simulate GHL API failure)
- [ ] Monitoring alerts configured (Slack webhook)

**Go-Live:**
- [ ] Client informed: "System is live"
- [ ] First real field test scheduled
- [ ] Developer on standby for monitoring

**Post-Launch:**
- [ ] Review first 24 hours of logs
- [ ] Analyze average response times
- [ ] Adjust if needed (optimize bottlenecks)

---

## Client Communication

**If response times are borderline (10-15s):**

```
"The GHL kill switch is working reliably - most requests 
complete in 5-8 seconds. During peak times or slower cell 
networks, it may take up to 12-15 seconds. 

This is still fast enough to prevent SMS in 95% of scenarios 
(typical SMS workflows wait 1-2 minutes before sending).

If you need guaranteed <10s, we could implement a premium 
caching layer (+$200 setup), but current performance should 
work well for field use."
```

**Set Expectations:**
- Be honest about real-world performance
- Under-promise, over-deliver
- Don't guarantee <10s if tests show 8-12s average
