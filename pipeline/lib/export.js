const COLUMNS = [
  "id", "brand", "name", "type", "variant", "riding_styles", "cert_standard", "cert_class", "cert_class_word",
  "other_certifications", "certification_evidence", "protectors", "materials", "listed_price", "price_amount",
  "price_currency", "needs_review", "source_images", "extracted_at",
];
const join = (a) => (a?.length ? a.join(" | ") : null);

export function toRow(r) {
  return {
    id: r.id, brand: r.brand, name: r.name, type: r.type, variant: r.variant,
    riding_styles: join(r.ridingStyles),
    cert_standard: r.certification?.standard ?? null,
    cert_class: r.certification?.class ?? null,
    cert_class_word: r.certification?.classWord ?? null,
    other_certifications: join(r.otherCertifications),
    certification_evidence: r.certificationEvidence,
    protectors: join(r.protectors),
    materials: join(r.materials),
    listed_price: r.listedPrice,
    price_amount: r.priceAmount,
    price_currency: r.priceCurrency,
    needs_review: join(r.needsReview),
    source_images: join(r.sourceImages),
    extracted_at: r.extractedAt,
  };
}

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// BOM so Excel on Windows reads the rupee sign correctly.
export function toCsv(records) {
  const rows = records.map(toRow);
  return "\uFEFF" + [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\r\n") + "\r\n";
}

const sqlVal = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

// SQLite-flavoured (INSERT OR REPLACE); loads with `sqlite3 gear.db < gear.sql`.
export function toSql(records) {
  const rows = records.map(toRow);
  const create = `CREATE TABLE IF NOT EXISTS gear (\n${COLUMNS.map((c) => `  ${c} ${c === "id" ? "TEXT PRIMARY KEY" : c === "price_amount" ? "REAL" : "TEXT"}`).join(",\n")}\n);\n`;
  const inserts = rows.map((r) => `INSERT OR REPLACE INTO gear (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map((c) => sqlVal(r[c])).join(", ")});`);
  return [create, ...inserts].join("\n") + "\n";
}
