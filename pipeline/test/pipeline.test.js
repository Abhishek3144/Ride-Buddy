import test from "node:test";
import assert from "node:assert/strict";
import { buildRecord, applyOverrides, parsePrice } from "../lib/build.js";
import { toCsv, toSql } from "../lib/export.js";

const ex = (over) => ({ name: "Trail Pro Jacket", type: "jackets", transcribedText: "Class AA as per EN 17092-3:2020. Cordura fabric. For adventure riding.", listedPrice: "₹12,950", unreadable: false, ...over });
const build = (extracted) => buildRecord({ brand: "Rynox", slug: "trail-pro-jacket", extracted, imageFiles: ["1.png"], now: "2026-01-01T00:00:00Z" });

test("rating comes from the transcribed text", () => {
  const r = build(ex());
  assert.deepEqual(r.certification, { standard: "EN 17092", class: "AA" });
  assert.deepEqual(r.needsReview, []);
  assert.equal(r.priceAmount, 12950);
  assert.equal(r.priceCurrency, "INR");
});

test("no stated class means no rating, even with armour claims", () => {
  const r = build(ex({ transcribedText: "CE Level 2 protectors (EN 1621-1). Mesh. Daily city rides." }));
  assert.equal(r.certification, null);
  assert.ok(r.needsReview.includes("certification"));
  assert.ok(r.protectors.length > 0);
});

test("unreadable images are flagged, other types stay flagged", () => {
  const r = build(ex({ unreadable: true, type: "other" }));
  assert.ok(r.needsReview.includes("unreadable_images"));
  assert.ok(r.needsReview.includes("type"));
});

test("overrides win and clear their flag", () => {
  const r = build(ex({ transcribedText: "Mesh jacket for city rides." }));
  const fixed = applyOverrides(r, { certification: { standard: "EN 17092", class: "A" } });
  assert.equal(fixed.certification.class, "A");
  assert.ok(!fixed.needsReview.includes("certification"));
});

test("first price only", () => {
  assert.equal(parsePrice("Rs. 5,999.00 Rs. 7,999.00").amount, 5999);
});

test("CSV quotes cells and SQL escapes quotes", () => {
  const r = build(ex({ name: `Rider's "Pro", Jacket` }));
  const csv = toCsv([r]);
  assert.ok(csv.startsWith("\uFEFFid,brand"));
  assert.ok(csv.includes('"Rider\'s ""Pro"", Jacket"'));
  assert.ok(toSql([r]).includes("'Rider''s \"Pro\", Jacket'"));
});
