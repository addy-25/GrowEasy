"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

// This component receives ONE thing from its parent: a function to call
// when a file has been dropped and parsed.
interface Props {
  onFileParsed: (file: File, rows: Record<string, string>[]) => void;
}

export default function UploadStep({ onFileParsed }: Props) {
  // Runs when the user drops or selects a file.
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Parse the CSV in the browser so we can preview it instantly.
      Papa.parse<Record<string, string>>(file, {
        header: true,          // use the first row as column names
        skipEmptyLines: true,
        complete: (results) => {
          onFileParsed(file, results.data); // report back UP to the parent
        },
      });
    },
    [onFileParsed]
  );

  // react-dropzone wires up all the drag events for us.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-lg font-medium">
        {isDragActive ? "Drop the CSV here…" : "Drag & drop a CSV file here"}
      </p>
      <p className="text-sm text-gray-500 mt-2">or click to browse</p>
    </div>
  );
}