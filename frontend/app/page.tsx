"use client";

import { useState } from "react";
import UploadStep from "@/components/UploadStep";
import PreviewTable from "@/components/PreviewTable";
import ResultView from "@/components/ResultView";
import { Step, ImportResult, PREVIEW_LIMIT } from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileParsed(uploadedFile: File, parsedRows: Record<string, string>[]) {
    setFile(uploadedFile);
    setRows(parsedRows);
    setError(null);
    setStep("preview");
  }

  async function handleConfirm() {
    if (!file) return;
    setStep("loading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/import`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Server responded with ${res.status}`);
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("preview");
    }
  }

  function reset() {
    setFile(null);
    setRows([]);
    setResult(null);
    setError(null);
    setStep("upload");
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 sm:py-16">
      <header className="text-center mb-10 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-bold gradient-text">
          GrowEasy CSV Importer
        </h1>
        <p className="mt-3 text-ink-mid max-w-xl mx-auto">
          Upload any messy leads CSV — our AI maps it into clean CRM records.
        </p>
      </header>

      <div className="w-full max-w-5xl">
        {step === "upload" && <UploadStep onFileParsed={handleFileParsed} />}

        {step === "preview" && (
          <div className="animate-fade-in-up space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-ink-mid">
                Previewing <b>{rows.length}</b> rows from <b>{file?.name}</b>
                {rows.length >= PREVIEW_LIMIT && (
                  <span className="text-ink-faint">
                    {" "}
                    (first {PREVIEW_LIMIT.toLocaleString()} shown — the full file is still imported)
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl bg-chip hover:bg-chip-strong border border-line transition"
                >
                  Start over
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                >
                  Confirm &amp; Import →
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm alert-error rounded-xl py-2 px-4">{error}</p>
            )}

            <PreviewTable rows={rows} />
          </div>
        )}

        {step === "loading" && (
          <div className="glass rounded-2xl p-16 text-center animate-fade-in-up">
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-line border-t-indigo-400 animate-spin" />
            <p className="text-lg font-medium">Processing with AI…</p>
            <p className="text-sm text-ink-dim mt-1">
              Mapping your columns into CRM fields
            </p>
          </div>
        )}

        {step === "result" && result && (
          <ResultView result={result} onReset={reset} />
        )}
      </div>
    </main>
  );
}
