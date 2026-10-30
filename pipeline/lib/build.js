import { extractCertification, protectorNotes, materialsIn, stylesIn, VARIANTS } from "../../shared/rules.js";

export function parsePrice(text) {
  if (!text) return { amount: null, currency: null };
  const n = text.match(/\d[\d,]*(?:\.\d+)?/);
  return {
    amount: n ? Number(n[0].replace(/,/g, "")) : null, // first price only (ignores a struck-through MRP)
    currency: /₹|\brs\b\.?|\binr\b/i.test(text) ? "INR" : null,
  };
}

// Builds one record from the model's transcription. The rating comes from the deterministic
// rules applied to the transcribed text, never from the model's own judgement.
export function buildRecord({ brand, slug, extracted, imageFiles, now = new Date().toISOString() }) {
  const type = extracted.type === "other" ? null : extracted.type;
  const text = `${extracted.name}. ${extracted.transcribedText}`;
  const cert = type ? extractCertification(text, type) : null;
  const materials = materialsIn(text);
  const ridingStyles = stylesIn(text);
  const price = parsePrice(extracted.listedPrice);

  const needsReview = [];
  if (!type) needsReview.push("type");
  if (!cert) needsReview.push("certification");
  if (!ridingStyles.length) needsReview.push("ridingStyles");
  if (!materials.length) needsReview.push("materials");
  if (extracted.unreadable) needsReview.push("unreadable_images");

  return {
    id: `${brand.toLowerCase()}-${slug}`,
    brand,
    name: extracted.name,
    type: type ?? "other",
    variant: extracted.variant ?? VARIANTS.find(([re]) => re.test(extracted.name))?.[1] ?? null,
    ridingStyles,
    certification: cert?.certification ?? null,
    otherCertifications: cert?.otherCertifications ?? [],
    certificationEvidence: cert?.evidence ?? null,
    protectors: protectorNotes(text),
    materials,
    listedPrice: extracted.listedPrice ?? null,
    priceAmount: price.amount,
    priceCurrency: price.currency,
    sourceImages: imageFiles,
    extractedAt: now,
    needsReview,
  };
}

// Hand corrections in a staging file's "overrides" win, and clear the matching review flag.
export function applyOverrides(record, overrides = {}) {
  const merged = { ...record, ...overrides };
  merged.needsReview = record.needsReview.filter((f) => !(f in overrides) && !(f === "unreadable_images" && "reviewed" in overrides));
  return merged;
}
