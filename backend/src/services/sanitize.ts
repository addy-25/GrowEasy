import { CrmRecord, CRM_STATUS, DATA_SOURCE } from "../types";

const EMAIL_PATTERN = /[^\s,;]+@[^\s,;]+\.[^\s,;]+/g;
const PHONE_PATTERN = /\d[\d\s-]{7,}\d/g;

// Escape literal line breaks so every record stays a single CSV row.
function stripNewlines(value: string): string {
  return value.replace(/\r\n|\r|\n/g, "\\n");
}

// If a field still holds multiple emails/phones, keep the first and
// collect the rest for crm_note.
function keepFirst(value: string, pattern: RegExp, extraNotes: string[]): string {
  const matches = value.match(pattern);
  if (!matches || matches.length <= 1) return value;
  extraNotes.push(...matches.slice(1));
  return matches[0];
}

function isValidDate(value: string): boolean {
  return value !== "" && !isNaN(new Date(value).getTime());
}

export function sanitizeRecord(r: CrmRecord): CrmRecord {
  const extraNotes: string[] = [];

  const email = keepFirst(r.email, EMAIL_PATTERN, extraNotes);
  const mobile = keepFirst(
    r.mobile_without_country_code,
    PHONE_PATTERN,
    extraNotes
  );

  const crm_status = (CRM_STATUS as readonly string[]).includes(r.crm_status)
    ? r.crm_status
    : "";
  const data_source = (DATA_SOURCE as readonly string[]).includes(r.data_source)
    ? r.data_source
    : "";

  // An unparseable date is blanked rather than passed downstream; the
  // original value is preserved in crm_note.
  let created_at = r.created_at;
  if (!isValidDate(created_at)) {
    if (created_at) extraNotes.push(`original date: ${created_at}`);
    created_at = "";
  }

  const crm_note = stripNewlines(
    [r.crm_note, ...extraNotes].filter(Boolean).join(" | ")
  );

  return {
    ...r,
    email,
    mobile_without_country_code: mobile,
    crm_status,
    data_source,
    created_at,
    crm_note,
  };
}
