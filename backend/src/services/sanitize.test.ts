import { describe, it, expect } from "vitest";
import { sanitizeRecord } from "./sanitize";
import { CrmRecord } from "../types";

function record(overrides: Partial<CrmRecord> = {}): CrmRecord {
  return {
    created_at: "",
    name: "",
    email: "",
    country_code: "",
    mobile_without_country_code: "",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "",
    crm_note: "",
    data_source: "",
    possession_time: "",
    description: "",
    ...overrides,
  };
}

describe("sanitizeRecord — enum guardrails (rules 1 & 2)", () => {
  it("keeps an allowed crm_status", () => {
    const out = sanitizeRecord(record({ crm_status: "SALE_DONE" }));
    expect(out.crm_status).toBe("SALE_DONE");
  });

  it("blanks a crm_status outside the allowed list", () => {
    const out = sanitizeRecord(record({ crm_status: "FOLLOW UP LATER" }));
    expect(out.crm_status).toBe("");
  });

  it("keeps an allowed data_source", () => {
    const out = sanitizeRecord(record({ data_source: "eden_park" }));
    expect(out.data_source).toBe("eden_park");
  });

  it("blanks a data_source outside the allowed list", () => {
    const out = sanitizeRecord(record({ data_source: "facebook_ads" }));
    expect(out.data_source).toBe("");
  });
});

describe("sanitizeRecord — created_at (rule 3)", () => {
  it("keeps a valid ISO date unchanged", () => {
    const out = sanitizeRecord(record({ created_at: "2026-05-13T14:20:48" }));
    expect(out.created_at).toBe("2026-05-13T14:20:48");
    expect(isNaN(new Date(out.created_at).getTime())).toBe(false);
  });

  it("blanks an impossible date and preserves the original in crm_note", () => {
    const out = sanitizeRecord(record({ created_at: "32/13/2026" }));
    expect(out.created_at).toBe("");
    expect(out.crm_note).toContain("original date: 32/13/2026");
  });

  it("leaves an already-empty date empty without adding a note", () => {
    const out = sanitizeRecord(record({ created_at: "" }));
    expect(out.created_at).toBe("");
    expect(out.crm_note).toBe("");
  });
});

describe("sanitizeRecord — multiple emails/phones (rule 5)", () => {
  it("keeps the first email and moves the rest into crm_note", () => {
    const out = sanitizeRecord(
      record({ email: "first@x.com, second@y.com" })
    );
    expect(out.email).toBe("first@x.com");
    expect(out.crm_note).toContain("second@y.com");
  });

  it("keeps the first phone and moves the rest into crm_note", () => {
    const out = sanitizeRecord(
      record({ mobile_without_country_code: "9876543210 / 9876543211" })
    );
    expect(out.mobile_without_country_code).toBe("9876543210");
    expect(out.crm_note).toContain("9876543211");
  });

  it("leaves a single clean email untouched", () => {
    const out = sanitizeRecord(record({ email: "solo@x.com" }));
    expect(out.email).toBe("solo@x.com");
    expect(out.crm_note).toBe("");
  });
});

describe("sanitizeRecord — CSV row safety (rule 6)", () => {
  it("escapes literal newlines in crm_note", () => {
    const out = sanitizeRecord(record({ crm_note: "line one\nline two" }));
    expect(out.crm_note).toBe("line one\\nline two");
    expect(out.crm_note).not.toContain("\n");
  });

  it("escapes Windows-style CRLF too", () => {
    const out = sanitizeRecord(record({ crm_note: "a\r\nb" }));
    expect(out.crm_note).toBe("a\\nb");
  });
});

describe("sanitizeRecord — untouched fields pass through", () => {
  it("does not modify name/company/city etc.", () => {
    const out = sanitizeRecord(
      record({ name: "Priya Singh", company: "Enterprise Corp", city: "Pune" })
    );
    expect(out.name).toBe("Priya Singh");
    expect(out.company).toBe("Enterprise Corp");
    expect(out.city).toBe("Pune");
  });
});
