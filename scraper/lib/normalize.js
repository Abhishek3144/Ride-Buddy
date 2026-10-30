import * as cheerio from "cheerio";
import { extractCertification, protectorNotes, materialsIn, stylesIn, VARIANTS } from "../../shared/rules.js";

const toText = (html) => cheerio.load(html ?? "").text().replace(/\s+/g, " ").trim();

// ---- gear type (from title and product type only) -------------------------
const ACCESSORY = /\b(cover|bag|bags|luggage|saddle|tank|tail|rain|cleaner|lock|mount|holder|tool|sticker|cap|balaclava|sock|socks|insurance|gift|voucher|bundle|combo)\b/i;
const TYPE_RULES = [
  ["armor", /\b(protector|protectors|armou?r|guard|guards|insert)\b/i],
  ["helmets", /\bhelmet/i],
  ["gloves", /\bglove/i],
  ["shoes", /\b(boot|boots|shoe|shoes|sneaker|sneakers)\b/i],
  ["pants", /\b(pant|pants|jeans|trouser|trousers|overpant|overpants)\b/i],
  ["jackets", /\bjacket/i],
];

export function detectType(p) {
  const hay = `${p.title} ${p.product_type ?? ""}`;
  if (ACCESSORY.test(hay)) return null;
  return TYPE_RULES.find(([, re]) => re.test(hay))?.[0] ?? null;
}

export function normalizeProduct(p, brandName, baseUrl, now = new Date().toISOString()) {
  const type = detectType(p);
  if (!type) return null;

  const body = toText(p.body_html);
  const hay = `${p.title}. ${body}`;
  const cert = extractCertification(hay, type);
  const materials = materialsIn(hay);
  const ridingStyles = stylesIn(hay);

  const needsReview = [];
  if (!cert) needsReview.push("certification");
  if (!ridingStyles.length) needsReview.push("ridingStyles");
  if (!materials.length) needsReview.push("materials");

  return {
    id: `${brandName.toLowerCase()}-${p.handle}`,
    name: p.title,
    brand: brandName,
    type,
    variant: VARIANTS.find(([re]) => re.test(p.title))?.[1] ?? null,
    ridingStyles,
    certification: cert?.certification ?? null,
    otherCertifications: cert?.otherCertifications ?? [],
    certificationEvidence: cert?.evidence ?? null,
    protectors: protectorNotes(hay),
    materials,
    images: [],                                   // add only once image usage is cleared with the brand
    imageUrls: (p.images ?? []).slice(0, 4).map((i) => i.src),
    sources: [],
    brandUrl: `${baseUrl}/products/${p.handle}`,
    listedPrice: p.variants?.[0]?.price ?? null,
    scrapedAt: now,
    needsReview,
  };
}
