import config from './config';
import { log, showToast } from './utils';
import type {
  RawFeed,
  RawLead,
  RawContact,
  Lead,
  Contact,
  PinColor,
  BadgeLetter,
  ContactStatus,
} from './types';

let cachedLeads: Lead[] = [];
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ---- Transformation Layer ----

const VALID_BADGES: BadgeLetter[] = ['T', 'H', 'V', 'D', 'C', ''];
const VALID_STATUSES: ContactStatus[] = ['primary', 'candidate', 'wrong', 'dnc', 'inactive'];

// Map Make's capitalized Pin_Color values to our lowercase PinColor type
const PIN_COLOR_MAP: Record<string, PinColor> = {
  flashing: 'flash',
  flash: 'flash',
  purple: 'purple',
  red: 'red',
  orange: 'orange',
  blue: 'blue',
};

function transformContact(raw: RawContact): Contact {
  const phone = raw.Phone_1 != null ? String(raw.Phone_1) : null;
  return {
    name: raw.Contact_Name || 'Unknown',
    phone,
    status: VALID_STATUSES.includes(raw.Contact_Status as ContactStatus)
      ? (raw.Contact_Status as ContactStatus)
      : 'candidate',
    source: raw.Source || '',
  };
}

function transformRawLead(raw: RawLead): Lead {
  const score = Number(raw.Heat_Score) || 0;
  const colorKey = (raw.Pin_Color ?? '').toLowerCase();
  const color = PIN_COLOR_MAP[colorKey] ?? 'blue';
  const badge = (raw.Context_Badge ?? '') as BadgeLetter;

  return {
    id: raw.Household_ID,
    address: raw.DealMashine_Normalized_Address || '',
    lat: Number(raw.Lat) || 0,
    lng: Number(raw.Lng) || 0,
    score,
    display_score: score > 99 ? '99+' : String(score),
    color,
    badge: VALID_BADGES.includes(badge) ? badge : '',
    lead_type: raw.Lead_Typ || '',
    ghl_contact_id: raw.GHL_Contact_ID || '',
    contacts: Array.isArray(raw.contacts)
      ? raw.contacts.map(transformContact)
      : [],
  };
}

/**
 * Parse raw JSON from Make.com — handles multiple formats:
 * 1. { "json": "[...]" }     — Make webhook response (stringified array)
 * 2. [{ ... }, { ... }]      — bare array of leads
 * 3. { "leads": [{ ... }] }  — wrapped with leads key
 */
function parseRawLeads(data: unknown): Lead[] {
  let rawLeads: RawLead[];

  // Format 1: Make webhook wrapper { "json": "stringified_array" }
  if (data && typeof data === 'object' && 'json' in data) {
    const wrapper = data as { json: string };
    const parsed = typeof wrapper.json === 'string'
      ? JSON.parse(wrapper.json)
      : wrapper.json;
    rawLeads = Array.isArray(parsed) ? parsed : [];
  }
  // Format 2: bare array
  else if (Array.isArray(data)) {
    rawLeads = data;
  }
  // Format 3: { leads: [...] }
  else if (data && typeof data === 'object' && 'leads' in data) {
    const feed = data as RawFeed;
    rawLeads = Array.isArray(feed.leads) ? feed.leads : [];
  }
  else {
    throw new Error('Invalid JSON: expected { json: "..." }, array, or { leads: [...] }');
  }

  return rawLeads.map(transformRawLead);
}

// ---- Data Fetching ----

/** Fetch leads from JSON feed URL */
export async function fetchLeads(): Promise<Lead[]> {
  log('Fetching leads from:', config.JSON_FEED_URL);

  try {
    const response = await fetch(config.JSON_FEED_URL, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    cachedLeads = parseRawLeads(data);
    log(`Loaded ${cachedLeads.length} leads`);
    return cachedLeads;
  } catch (error) {
    log('Feed fetch failed:', error);

    // In debug mode, try local test data
    if (config.DEBUG) {
      return fetchTestData();
    }

    throw error;
  }
}

/** Fetch local test data for development */
async function fetchTestData(): Promise<Lead[]> {
  log('Falling back to test data...');
  const response = await fetch('/test-data/mock-leads.json');

  if (!response.ok) throw new Error('Test data not found');

  const data: unknown = await response.json();
  cachedLeads = parseRawLeads(data);
  showToast(`Using test data (${cachedLeads.length} leads)`, 'info');
  return cachedLeads;
}

/** Start auto-refresh timer (every 5 minutes) */
export function startAutoRefresh(
  onRefresh: (leads: Lead[]) => void,
): void {
  stopAutoRefresh();

  refreshTimer = setInterval(async () => {
    try {
      const leads = await fetchLeads();
      onRefresh(leads);
      log('Auto-refresh complete');
    } catch {
      log('Auto-refresh failed, will retry next interval');
    }
  }, config.REFRESH.autoRefreshInterval);
}

/** Stop auto-refresh timer */
export function stopAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
