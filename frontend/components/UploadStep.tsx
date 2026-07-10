"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";

interface Props {
  onFileParsed: (file: File, rows: Record<string, string>[]) => void;
}

export default function UploadStep({ onFileParsed }: Props) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shared logic: validate + parse, whether the file came from drag OR click.
  function handleFile(file: File | undefined) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setLocalError("Please upload a .csv file.");
      return;
    }
    setLocalError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => onFileParsed(file, results.data),
      error: () => setLocalError("Could not read that file. Is it a valid CSV?"),
    });
  }

  // --- native drag & drop ---
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();        // ← CRITICAL: marks the box as a valid drop target
    setIsDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();        // ← stops the browser from opening the file
    setIsDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);   // the dropped file lives here
  }

  return (
    <div className="animate-fade-in-up">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass rounded-2xl p-12 sm:p-16 text-center cursor-pointer group transition-all duration-300 ${
          isDragActive
            ? "ring-2 ring-indigo-400 scale-[1.02] bg-white/10"
            : "hover:bg-white/[0.08]"
        }`}
      >
        {/* hidden real file input — opened when the box is clicked */}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* icon (pointer-events-none so it never interferes with drag events) */}
        <div
          className={`pointer-events-none mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 transition-transform duration-300 ${
            isDragActive ? "scale-110" : "group-hover:scale-105"
          }`}
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(168,85,247,0.35))",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-9 w-9 text-indigo-100"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <p className="pointer-events-none text-xl font-semibold">
          {isDragActive ? "Drop it here" : "Drag & drop your CSV"}
        </p>
        <p className="pointer-events-none mt-2 text-sm text-white/50">
          or click to browse your files
        </p>
        <p className="pointer-events-none mt-4 inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-white/40 border border-white/10">
          .csv files only
        </p>
      </div>

      {localError && (
        <p className="mt-4 text-center text-sm text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-xl py-2 px-4 animate-fade-in-up">
          {localError}
        </p>
      )}
    </div>
  );
}