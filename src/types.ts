// ---- Raw Types from Make.com Scenario B ----

export interface RawFeed {
  leads: RawLead[];
}

export interface RawLead {
  Household_ID: string;
  GHL_Contact_ID: string | null;
  Lat: number;
  Lng: number;
  Heat_Score: string | number;
  Context_Badge: string | null;
  Pin_Color: string;
  DealMashine_Normalized_Address: string | null;  // Note: Make uses "sh" spelling
  Lead_Typ: string;
  contacts: RawContact[];
}

export interface RawContact {
  Contact_Name: string;
  Phone_1: string | number | null;
  Contact_Status: string;
  Source: string;
}

// ---- Internal App Types (transformed from Raw) ----

export interface Lead {
  id: string;                       // Household_ID
  address: string;                  // Full DealMachine normalized address
  lat: number;
  lng: number;
  score: number;
  display_score: string;            // Client-calculated: "95" or "99+"
  color: PinColor;
  badge: BadgeLetter;
  lead_type: string;                // "Vacant", "Probate" etc.
  ghl_contact_id: string;           // Single GHL Contact ID per Household
  contacts: Contact[];              // 1:N contacts per Household
}

export interface Contact {
  name: string;
  phone: string | null;
  status: ContactStatus;
  source: string;
}

export type PinColor = 'flash' | 'purple' | 'red' | 'orange' | 'blue';
export type BadgeLetter = 'T' | 'H' | 'V' | 'D' | 'C' | '';
export type ContactStatus = 'primary' | 'candidate' | 'wrong' | 'dnc' | 'inactive';

// ---- Pin Rendering Types ----

export interface PinConfig {
  score: string;
  color: PinColor;
  badge: BadgeLetter;
  isFlash: boolean;
}

// ---- Kill Switch Payload (Scenario C) ----

export interface KillSwitchPayload {
  household_id: string;
  ghl_contact_id: string;
  timestamp: string;                // ISO 8601
}
