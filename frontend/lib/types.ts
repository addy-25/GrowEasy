// One CRM record — must match the backend's CrmRecord exactly.
export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

// What the backend returns from POST /api/import.
export interface ImportResult {
  records: CrmRecord[];
  skipped: CrmRecord[];
  totalImported: number;
  totalSkipped: number;
}

// The four screens the app can show.
export type Step = "upload" | "preview" | "loading" | "result";