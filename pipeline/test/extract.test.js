import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExtracted, buildGeminiBody, parseGeminiResponse } from "../lib/extract.js";

const reply = (text) => ({ candidates: [{ content: { parts: [{ text }] } }] });

test("valid reply is parsed and cleaned", () => {
  const r = parseGeminiResponse(reply(JSON.stringify({ name: " Trail Jacket ", type: "jackets", transcribedText: "Class AA", unreadable: false, variant: "", listedPrice: null })));
  assert.deepEqual(r, { name: "Trail Jacket", type: "jackets", variant: null, listedPrice: null, transcribedText: "Class AA", unreadable: false });
});

test("code fences are tolerated, unknown types become other", () => {
  const r = parseGeminiResponse(reply('```json\n{"name":"X","type":"scarf","transcribedText":"t","unreadable":true}\n```'));
  assert.equal(r.type, "other");
  assert.equal(r.unreadable, true);
});

test("blocked or empty replies throw a clear error", () => {
  assert.throws(() => parseGeminiResponse({ promptFeedback: { blockReason: "SAFETY" } }), /SAFETY/);
  assert.throws(() => parseGeminiResponse(reply("{}")), /missing/);
});

test("request carries every image then the prompt, in JSON mode", () => {
  const body = buildGeminiBody([{ mime: "image/png", data: "AAA" }, { mime: "image/jpeg", data: "BBB" }]);
  const parts = body.contents[0].parts;
  assert.equal(parts.length, 3);
  assert.equal(parts[0].inline_data.mime_type, "image/png");
  assert.ok(parts[2].text.includes("Never infer a certification"));
  assert.equal(body.generationConfig.responseMimeType, "application/json");
});

test("non-object result is rejected", () => {
  assert.throws(() => normalizeExtracted(null), /not an object/);
});
