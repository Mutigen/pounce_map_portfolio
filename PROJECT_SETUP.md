# Pounce Map - Project Setup Guide

## 📦 Installation to Local Machine

```bash
cd /Volumes/CrucialX10/Projects/pounce-map/

# Copy all files from the structure generated
# (Claude will provide files - paste them into your local project)

# Initialize Git
git init
git add .
git commit -m "Initial project structure - Pounce Map v2.3.1"

# Add remote
git remote add origin https://github.com/Mutigen/pounce-map.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## ⚙️ Configuration Steps

### 1. Update Config Files

**frontend/js/config.js:**
```javascript
// Update these after client provides credentials:
JSON_ENDPOINT: 'https://your-json-endpoint.com/leads.json'
AIRTABLE_FORM_BASE_URL: 'https://airtable.com/shrXXXXXXX'
```

**frontend/index.html:**
```html
<!-- Replace YOUR_API_KEY with actual Google Maps API key -->
<script src="https://maps.googleapis.com/maps/api/js?key=ACTUAL_KEY&libraries=places"></script>
```

---

### 2. Set Up Make.com Account

**Account Setup:**
- Sign up at https://www.make.com
- Choose plan: Free tier (1,000 ops/month) or Core ($9/month, 10,000 ops)
- **Recommendation:** Start with Free, upgrade if needed

**Create 3 Scenarios:**
1. **Scenario A:** Follow `backend/scenario-a-import.md`
2. **Scenario B:** Follow `backend/scenario-b-json.md`
3. **Scenario C:** Follow `backend/scenario-c-ghl.md`

---

### 3. Set Up Airtable Base

**Option A: Create in Client's Workspace (Recommended)**
- Client invites you as Creator/Owner
- You build base from `airtable/schema.json`
- Formulas from `airtable/formulas.md`
- Views from `airtable/views.md`

**Option B: Create in Your Workspace**
- Build base in your account
- Share with client after completion
- Transfer ownership during handoff

**Import Test Data:**
```bash
# Use test-data/clustering_test_data.json
# Import via Airtable CSV import feature
```

---

### 4. GHL API Setup

**Waiting on Client to Provide:**
- [ ] Location-level API Key
- [ ] Custom Field names (Active_Phone_Index, etc.)
- [ ] Confirmation of tag name: "status-engaged"
- [ ] Workflow IDs (08 and 11)

**Once Received:**
- Add API key to Make.com Scenario C
- Test tag application with test contact
- Verify workflows stop correctly

---

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
cd frontend
vercel

# Follow prompts:
# - Link to existing project? No
# - What's your project's name? pounce-map
# - Which directory? ./ (current)
# - Override settings? No

# Production deployment
vercel --prod
```

**Alternative: GitHub Integration**
- Connect Vercel to GitHub repo
- Auto-deploy on git push to main
- Preview deployments for branches

---

## 🧪 Testing Checklist

### Phase 1 (Backend)

- [ ] **Airtable Setup**
  - [ ] Base created with all tables
  - [ ] Formulas working correctly
  - [ ] Views filtering properly
  - [ ] Test data imported

- [ ] **Make.com Scenario A**
  - [ ] CSV import working
  - [ ] Deduplication logic validated
  - [ ] Geocoding triggers when needed
  - [ ] Notifications sent

- [ ] **Make.com Scenario B**
  - [ ] JSON feed generated
  - [ ] Manual "Push to Map" button works
  - [ ] Daily 5AM schedule configured
  - [ ] JSON structure correct

- [ ] **Make.com Scenario C**
  - [ ] GHL API connection established
  - [ ] Tag application <10s response time
  - [ ] Airtable updates correctly
  - [ ] Error handling tested

---

### Phase 2 (Frontend)

- [ ] **Map Rendering**
  - [ ] JSON endpoint loads successfully
  - [ ] Markers display at correct coordinates
  - [ ] Clustering works smoothly (2000+ pins)
  - [ ] Custom paddle pins show score + badge

- [ ] **Pin Colors**
  - [ ] Red pins (score ≥80)
  - [ ] Orange pins (score 50-79)
  - [ ] Blue pins (score <50)
  - [ ] Purple pins (data gaps)
  - [ ] Flash animation (auction <7 days)

- [ ] **Bottom Sheet**
  - [ ] Opens on pin click
  - [ ] Shows correct lead data
  - [ ] NAVIGATE button opens Google Maps app
  - [ ] LOG NOTE button opens Airtable form

- [ ] **Mobile Performance**
  - [ ] Tested on iPhone (real device)
  - [ ] Tested on Android (real device)
  - [ ] No lag with 2000+ pins
  - [ ] Deep links work correctly

---

### Phase 3 (Integration)

- [ ] **End-to-End Flow**
  - [ ] Import CSV → Airtable → JSON → Map
  - [ ] Click pin → Bottom sheet → Navigate
  - [ ] Click pin → Bottom sheet → Log Note → GHL tag → SMS stops

- [ ] **Performance Validation**
  - [ ] GHL kill switch <10s consistently
  - [ ] Map loads in <5s on 4G
  - [ ] Clustering smooth at all zoom levels

- [ ] **Documentation**
  - [ ] Field mapping guide written
  - [ ] GHL integration docs complete
  - [ ] Deployment guide tested
  - [ ] Handoff video recorded

---

## 📝 Client Handoff Checklist

- [ ] GitHub repo access granted
- [ ] Airtable base ownership transferred
- [ ] Make.com scenarios exported as blueprints
- [ ] Vercel project ownership transferred
- [ ] Documentation reviewed with client
- [ ] Training video provided
- [ ] Support period defined (30 days?)

---

## 🆘 Troubleshooting

### "JSON feed not loading"
- Check Make.com Scenario B logs
- Verify JSON endpoint URL in config.js
- Test URL directly in browser

### "Pins not clustering"
- Verify @googlemaps/markerclusterer library loaded
- Check browser console for errors
- Reduce gridSize in config.js

### "GHL tag not applying"
- Check Make.com Scenario C logs
- Verify API key has correct permissions
- Test GHL API directly with Postman

### "Map not loading on mobile"
- Check Google Maps API key restrictions
- Verify HTTPS (required for geolocation)
- Test on actual device, not simulator

---

## 📞 Support Contacts

**Client:** Jerrelle Williams
**Email:** [to be provided]
**Phone:** [to be provided]

**Developer:** Levan (mamiko)
**Upwork:** [profile link]
**GitHub:** github.com/Mutigen
