import "dotenv/config"; // must load before any module reads process.env
import express from "express";
import cors from "cors";
import multer from "multer";
import { parseCsv } from "./services/csv";
import { extractAll } from "./services/extractor";
import { sanitizeRecord } from "./services/sanitize";

const MAX_ROWS = 2000;

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const rows = parseCsv(req.file.buffer);

    if (rows.length === 0) {
      res.status(400).json({ error: "CSV contains no data rows" });
      return;
    }
    if (rows.length > MAX_ROWS) {
      res.status(413).json({
        error: `File has ${rows.length} rows — the limit is ${MAX_ROWS} rows per import.`,
      });
      return;
    }

    const extracted = await extractAll(rows);

    // Hard rules (allowed enums, date validity, single-line values) are
    // enforced in code rather than trusted to the model.
    const cleaned = extracted.map(sanitizeRecord);

    const skipped = cleaned.filter(
      (r) => !r.email && !r.mobile_without_country_code
    );
    const imported = cleaned.filter(
      (r) => r.email || r.mobile_without_country_code
    );

    res.json({
      records: imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to process CSV" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
