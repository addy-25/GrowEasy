export const CRM_STATUS = [
  "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE",
] as const;

export const DATA_SOURCE = [
  "leads_on_demand", "meridian_tower", "eden_park",
  "varah_swamy", "sarjapur_plots",
] as const;

export interface CrmRecord {
  created_at: string; name: string; email: string;
  country_code: string; mobile_without_country_code: string;
  company: string; city: string; state: string; country: string;
  lead_owner: string; crm_status: string; crm_note: string;
  data_source: string; possession_time: string; description: string;
}