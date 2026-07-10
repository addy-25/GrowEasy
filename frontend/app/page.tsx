"use client";

import { useState } from "react";
import UploadStep from "@/components/UploadStep";
import { Step, ImportResult } from "@/lib/types";

export default function Home() {
  // THE state machine variable — which screen are we on?
  const [step, setStep] = useState<Step>("upload");

  // Data we collect along the way:
  const [rows, setRows] = useState<Record<string, string>[]>([]); // parsed CSV (for preview)
  const [file, setFile] = useState<File | null>(null);             // the actual file (to send later)
  const [result, setResult] = useState<ImportResult | null>(null); // backend's answer
  const [error, setError] = useState<string | null>(null);

  // The function we hand DOWN to UploadStep. It calls this when a file is ready.
  function handleFileParsed(uploadedFile: File, parsedRows: Record<string, string>[]) {
    setFile(uploadedFile);
    setRows(parsedRows);
    setError(null);
    setStep("preview"); // ← switch the screen
  }

  function reset() {
    setFile(null);
    setRows([]);
    setResult(null);
    setError(null);
    setStep("upload");
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">GrowEasy CSV Importer</h1>

        {step === "upload" && <UploadStep onFileParsed={handleFileParsed} />}

        {/* Temporary placeholder — we build the real preview table next */}
        {step === "preview" && (
          <div>
            <p className="mb-4">✅ Parsed {rows.length} rows from <b>{file?.name}</b></p>
            <button onClick={reset} className="px-4 py-2 rounded bg-gray-200">
              Start over
            </button>
          </div>
        )}
      </div>
    </main>
  );
}