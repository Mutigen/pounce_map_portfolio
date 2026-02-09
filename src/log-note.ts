import config from './config';
import { log, showToast } from './utils';
import type { Lead, LogNotePayload, NoteType } from './types';

/** Render the in-app LOG NOTE form HTML */
export function renderLogNoteForm(): string {
  const options = config.NOTE_TYPES.map(
    (t) => `<option value="${t}">${t}</option>`,
  ).join('');

  return `<form id="log-note-form" class="log-note-form">
    <div class="form-group">
      <label for="note-type">Note Type</label>
      <select id="note-type" name="note_type" required>
        <option value="" disabled selected>Select type...</option>
        ${options}
      </select>
    </div>
    <div class="form-group">
      <label for="note-text">Notes</label>
      <textarea id="note-text" name="notes"
                placeholder="No answer, left door hanger..."
                rows="3"></textarea>
    </div>
    <div class="form-actions">
      <button type="button" id="log-note-cancel" class="btn-cancel">Cancel</button>
      <button type="submit" id="log-note-submit" class="btn-submit">Submit</button>
    </div>
  </form>`;
}

/** Submit LOG NOTE to Make.com webhook */
export async function submitLogNote(
  lead: Lead,
  noteType: NoteType,
  notes: string,
): Promise<boolean> {
  const payload: LogNotePayload = {
    household_id: lead.id,
    note_type: noteType,
    notes,
    ghl_contact_ids: lead.ghl_contact_ids,
    timestamp: new Date().toISOString(),
  };

  log('Submitting LOG NOTE:', payload);

  try {
    const response = await fetch(config.MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    showToast('Note saved successfully', 'info');
    return true;
  } catch (error) {
    log('LOG NOTE submission failed:', error);
    showToast('Failed to save note. Please try again.', 'error');
    return false;
  }
}
