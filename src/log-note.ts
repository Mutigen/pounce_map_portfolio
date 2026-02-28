import config from './config';
import { log, showToast } from './utils';
import type { Lead, KillSwitchPayload } from './types';

/** Fire kill switch: POST ghl_contact_id to Make Scenario C (fire & forget) */
export function fireKillSwitch(lead: Lead): void {
  const payload: KillSwitchPayload = {
    household_id: lead.id,
    ghl_contact_id: lead.ghl_contact_id,
    timestamp: new Date().toISOString(),
  };

  log('Firing kill switch:', payload);

  fetch(config.MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((error) => {
    log('Kill switch request failed:', error);
    showToast('Kill switch failed — check connection', 'error');
  });
}

/** Open Airtable form prefilled with lead data */
export function openAirtableForm(lead: Lead): void {
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
