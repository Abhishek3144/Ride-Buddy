import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProduct, detectType } from "../lib/normalize.js";

// Made-up products that mimic how brand pages tend to word things.
const make = (title, body, extra = {}) => ({ title, handle: title.toLowerCase().replace(/\W+/g, "-"), body_html: body, images: [], variants: [{ price: "9999.00" }], ...extra });
const norm = (p) => normalizeProduct(p, "Test", "https://example.test", "2026-01-01T00:00:00Z");

test("garment class is read only when the page states it", () => {
  const n = norm(make("Trail Pro Jacket", "<p>Certified to Class AA as per EN 17092-3:2020. Ideal for adventure and touring.</p>"));
  assert.equal(n.type, "jackets");
  assert.deepEqual(n.certification, { standard: "EN 17092", class: "AA" });
  assert.deepEqual(n.ridingStyles, ["offroad", "touring"]);
});

test("armour level is not mistaken for the garment rating", () => {
  const n = norm(make("Urban Jacket", "<p>Comes with CE Level 2 protectors (EN 1621-1) at shoulder and elbow. Great for daily commutes.</p>"));
  assert.equal(n.certification, null);
  assert.ok(n.needsReview.includes("certification"));
  assert.ok(n.protectors.length > 0);
});

test("lowercase 'class a' prose is not a rating", () => {
  const n = norm(make("Plain Jacket", "<p>EN 17092 tested. A world class a lot of riders like.</p>"));
  assert.equal(n.certification, null);
});

test("gloves and boots use levels", () => {
  const g = norm(make("Road Gloves", "<p>EN 13594:2015 Level 2 knuckle protection.</p>"));
  assert.deepEqual(g.certification, { standard: "EN 13594", class: "2", classWord: "level" });
  const b = norm(make("Tour Boots", "<p>Meets EN 13634 level 1.</p>"));
  assert.equal(b.certification.class, "1");
});

test("helmet takes the highest-ranked standard and lists the rest", () => {
  const n = norm(make("Road Helmet", "<p>ECE 22.06 approved. Also ISI marked (IS 4151) and DOT approved.</p>"));
  assert.equal(n.certification.standard, "ECE 22.06");
  assert.deepEqual(n.otherCertifications, ["DOT FMVSS 218", "BIS IS 4151"]);
});

test("accessories are skipped", () => {
  assert.equal(detectType({ title: "Jacket Cover Pro" }), null);
  assert.equal(detectType({ title: "Tank Bag" }), null);
  assert.equal(detectType({ title: "Rain Jacket" }), null);
  assert.equal(detectType({ title: "Knee Protector" }), "armor");
});

test("images are kept as URLs only", () => {
  const n = norm(make("Any Jacket", "<p>x</p>", { images: [{ src: "https://cdn.test/a.jpg" }] }));
  assert.deepEqual(n.images, []);
  assert.deepEqual(n.imageUrls, ["https://cdn.test/a.jpg"]);
});
