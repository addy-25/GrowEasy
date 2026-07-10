"use client";

import { useState } from "react";
import UploadStep from "@/components/UploadStep";
import PreviewTable from "@/components/PreviewTable";
import { Step, ImportResult } from "@/lib/types";
import ResultView from "@/components/ResultView";


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

  // STEP 3 → 4: send the file to the backend, show loading, then results.
  async function handleConfirm() {
    if (!file) return;
    setStep("loading");
    setError(null);

    try {
      // package the file the way the browser + multer expect
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/import`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data: ImportResult = await res.json();
      setResult(data);
      setStep("result");
    } catch (err) {
      // on failure, go back to preview and show what went wrong
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
        <p className="mt-3 text-white/60 max-w-xl mx-auto">
          Upload any messy leads CSV — our AI maps it into clean CRM records.
        </p>
      </header>

      <div className="w-full max-w-5xl">
        {/* STEP 1 — upload */}
        {step === "upload" && <UploadStep onFileParsed={handleFileParsed} />}

        {/* STEP 2 + 3 — preview + confirm */}
        {step === "preview" && (
          <div className="animate-fade-in-up space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-white/70">
                Previewing <b>{rows.length}</b> rows from <b>{file?.name}</b>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition"
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
              <p className="text-sm text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-xl py-2 px-4">
                {error}
              </p>
            )}

            <PreviewTable rows={rows} />
          </div>
        )}

        {/* STEP loading */}
        {step === "loading" && (
          <div className="glass rounded-2xl p-16 text-center animate-fade-in-up">
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-white/20 border-t-indigo-400 animate-spin" />
            <p className="text-lg font-medium">Processing with AI…</p>
            <p className="text-sm text-white/50 mt-1">Mapping your columns into CRM fields</p>
          </div>
        )}

        
        {step === "result" && result && (
          <ResultView result={result} onReset={reset} />
        )}
      </div>
    </main>
  );
}