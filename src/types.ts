// ---- JSON Feed Types ----

export interface MapFeed {
  generated_at: string;
  total_leads: number;
  leads: Lead[];
}

export interface Lead {
  id: string;                       // Household_ID (MD5 hash)
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  score: number;
  display_score: string;            // "95" or "99+"
  color: PinColor;
  badge: BadgeLetter;
  tags: string[];
  auction_date: string | null;
  days_until_auction: number | null;
  ghl_contact_ids: string[];        // Array of ALL linked GHL contact IDs
  contacts: Contact[];              // Array of contact objects
  last_note_date: string | null;
}

export interface Contact {
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string;
  status: ContactStatus;
  confidence: ConfidenceLevel;
  source: string;
}

export type PinColor = 'flash' | 'purple' | 'red' | 'orange' | 'blue';
export type BadgeLetter = 'T' | 'H' | 'V' | 'D' | 'C' | '';
export type ContactStatus = 'primary' | 'candidate' | 'wrong' | 'dnc' | 'inactive';
export type ConfidenceLevel = 'high' | 'med' | 'low';

// ---- Pin Rendering Types ----

export interface PinConfig {
  score: string;
  color: PinColor;
  badge: BadgeLetter;
  isFlash: boolean;
}

// ---- Log Note Types ----

export interface LogNotePayload {
  household_id: string;
  note_type: NoteType;
  notes: string;
  ghl_contact_ids: string[];
  timestamp: string;                // ISO 8601
}

export type NoteType =
  | 'Spoke to Owner'
  | 'Left Note'
  | 'Left Door Hanger'
  | 'Dead / DNC'
  | 'No Access'
  | 'Hostile Owner';
