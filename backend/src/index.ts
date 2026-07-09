const skipped = extracted.filter(r => !r.email && !r.mobile_without_country_code);
const imported = extracted.filter(r => r.email || r.mobile_without_country_code);

res.json({
  records: imported,
  skipped,
  totalImported: imported.length,
  totalSkipped: skipped.length,
});