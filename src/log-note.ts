import config from './config';
import { log, showToast } from './utils';
import { isDemoMode } from './data';
import type { Lead, KillSwitchPayload } from './types';

const KILL_SWITCH_MAX_ATTEMPTS = 3;

async function postWithRetry(url: string, payload: KillSwitchPayload): Promise<void> {
  for (let attempt = 1; attempt <= KILL_SWITCH_MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) return;
    if (attempt < KILL_SWITCH_MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    } else {
      throw new Error(`HTTP ${response.status} after ${KILL_SWITCH_MAX_ATTEMPTS} attempts`);
    }
  }
}

/** Fire kill switch: POST ghl_contact_id to Make Scenario C (retries up to 3x) */
export function fireKillSwitch(lead: Lead): void {
  if (isDemoMode) {
    log('Demo mode: kill switch skipped');
    return;
  }

  const payload: KillSwitchPayload = {
    household_id: lead.id,
    ghl_contact_id: lead.ghl_contact_id,
    timestamp: new Date().toISOString(),
  };

  log('Firing kill switch:', payload);

  postWithRetry(config.MAKE_WEBHOOK_URL, payload).catch((error) => {
    log('Kill switch failed after retries:', error);
    showToast('Kill switch failed — check connection', 'error');
  });
}

/** Open Airtable form prefilled with lead data */
export function openAirtableForm(lead: Lead): void {
  if (isDemoMode) {
    log('Demo mode: Airtable form skipped');
    showToast('Demo mode — Log Note disabled', 'info');
    return;
  }

  const params = new URLSearchParams();
  params.set('prefill_Household ID', lead.id);
  params.set('prefill_GHL ID', lead.ghl_contact_id);
  if (lead.lead_type) {
    params.set('prefill_Lead Type', lead.lead_type);
  }

  const url = `${config.AIRTABLE_FORM_URL}?${params.toString()}`;
  log('Opening Airtable form:', url);
  window.open(url, '_blank');
}
