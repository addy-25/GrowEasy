"use client";

import Papa from "papaparse";
import { CrmRecord, ImportResult } from "@/lib/types";

interface Props {
  result: ImportResult;
  onReset: () => void;
}

// The 15 CRM columns in display order, with readable labels.
const COLUMNS: { key: keyof CrmRecord; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "Code" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "crm_status", label: "Status" },
  { key: "data_source", label: "Source" },
  { key: "created_at", label: "Created" },
  { key: "lead_owner", label: "Owner" },
  { key: "crm_note", label: "Note" },
  { key: "possession_time", label: "Possession" },
  { key: "description", label: "Description" },
];

// Color-coded badge per CRM status so results are scannable at a glance.
const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  DID_NOT_CONNECT: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  BAD_LEAD: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  SALE_DONE: "bg-sky-500/15 text-sky-200 border-sky-500/30",
};

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-white/30">—</span>;
  const style = STATUS_STYLES[status] ?? "bg-white/10 text-white/70 border-white/20";
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
}

// One reusable table — used for BOTH imported and skipped records.
function CrmTable({ records }: { records: CrmRecord[] }) {
  if (records.length === 0) {
    return <p className="text-white/50 text-sm py-4 text-center">No records.</p>;
  }
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[#141024]/90 backdrop-blur-md">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 font-semibold whitespace-nowrap text-white/90 border-b border-white/10"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    title={r[c.key]}
                    className="px-4 py-2.5 whitespace-nowrap text-white/70 border-b border-white/5 max-w-[220px] truncate"
                  >
                    {c.key === "crm_status" ? (
                      <StatusBadge status={r.crm_status} />
                    ) : (
                      r[c.key] || <span className="text-white/30">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="glass rounded-2xl px-6 py-5 flex-1 min-w-[140px]">
      <p className="text-sm text-white/50">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

export default function ResultView({ result, onReset }: Props) {
  // records -> CSV text (in our exact column order) -> browser "save file" dialog.
  // Papa.unparse is the reverse of Papa.parse; it handles quoting/escaping (rule 6).
  function downloadCsv() {
    const csv = Papa.unparse(result.records, {
      columns: COLUMNS.map((c) => c.key),
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "groweasy-crm-import.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* the totals the PDF requires, as stat cards */}
      <div className="flex flex-wrap gap-4">
        <StatCard label="Total imported" value={result.totalImported} accent="text-emerald-300" />
        <StatCard label="Total skipped" value={result.totalSkipped} accent="text-amber-300" />
        <StatCard
          label="Total processed"
          value={result.totalImported + result.totalSkipped}
          accent="text-white"
        />
      </div>

      {/* imported records */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Imported records
        </h2>
        <CrmTable records={result.records} />
      </div>

      {/* skipped records — only rendered when there are any */}
      {result.totalSkipped > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Skipped records
            <span className="text-sm font-normal text-white/40">(no email or mobile)</span>
          </h2>
          <CrmTable records={result.skipped} />
        </div>
      )}

      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={downloadCsv}
          className="px-6 py-2.5 rounded-xl font-semibold text-white transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #10b981, #14b8a6)" }}
        >
          ⬇ Download CSV
        </button>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition"
        >
          Import another file
        </button>
      </div>
    </div>
  );
}