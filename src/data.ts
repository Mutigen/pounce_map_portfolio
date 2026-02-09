import config from './config';
import { log, showToast } from './utils';
import type { MapFeed, Lead } from './types';

let cachedLeads: Lead[] = [];
let refreshTimer: ReturnType<typeof setInterval> | null = null;

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

    const data: MapFeed = await response.json();

    if (!data.leads || !Array.isArray(data.leads)) {
      throw new Error('Invalid JSON: missing leads array');
    }

    cachedLeads = data.leads;
    log(`Loaded ${cachedLeads.length} leads (generated: ${data.generated_at})`);
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

  const data: MapFeed = await response.json();
  cachedLeads = data.leads;
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
