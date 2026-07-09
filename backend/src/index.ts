import "dotenv/config";                 // load .env FIRST, before anything else
import express from "express";
import cors from "cors";
import multer from "multer";
import { parseCsv } from "./services/csv";
import { extractAll } from "./services/extractor";
import { sanitizeRecord } from "./services/sanitize";

const app = express();
app.use(cors());                        // let the frontend call this server

// keep the uploaded file in memory instead of saving to disk
const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // 1. raw CSV bytes -> array of row objects
    const rows = parseCsv(req.file.buffer);

    // 2. AI maps each row into our CRM shape (batched, with retry)
    const extracted = await extractAll(rows);

        // 3. GUARDRAIL: enforce every hard rule in code — don't trust the AI blindly
    const cleaned = extracted.map(sanitizeRecord);

    // 4. skip rule: a lead with neither email nor mobile is useless
    const skipped = cleaned.filter((r) => !r.email && !r.mobile_without_country_code);
    const imported = cleaned.filter((r) => r.email || r.mobile_without_country_code);

    // 5. the exact shape the frontend's Step 4 needs
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