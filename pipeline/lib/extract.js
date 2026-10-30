import { readFile } from "node:fs/promises";
import path from "node:path";
import { GEMINI_MODEL, IMAGE_TYPES } from "../config.js";

export const TYPES = ["jackets", "helmets", "gloves", "pants", "shoes", "armor", "other"];

export const PROMPT = `These screenshots are from one product page of a motorcycle riding gear brand.
Return JSON with these fields:
- name: the product name exactly as shown
- type: one of ${TYPES.join(", ")}
- variant: e.g. Gauntlet, Full-face, Riding jeans, only if the page says so, else null
- listedPrice: the price text exactly as shown, including the currency symbol, else null
- transcribedText: all description, feature, material and certification text visible, copied as written
- unreadable: true if any relevant text is cut off, blurry or too small to read

Rules:
- Copy text as written. Do not paraphrase, summarise or add anything that is not on screen.
- Never infer a certification or class. If a standard or class is not written, leave it out.
- Keep standards exactly as printed (for example "EN 17092", "Class AA", "CE Level 2", "ECE 22.06").`;

const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    type: { type: "STRING", description: `One of: ${TYPES.join(", ")}` },
    variant: { type: "STRING", nullable: true },
    listedPrice: { type: "STRING", nullable: true },
    transcribedText: { type: "STRING" },
    unreadable: { type: "BOOLEAN" },
  },
  required: ["name", "type", "transcribedText", "unreadable"],
};

const str = (v) => (v === null || v === undefined ? null : String(v).trim() || null);

// Whatever the model returns is cleaned and validated before it is stored.
export function normalizeExtracted(o) {
  if (!o || typeof o !== "object") throw new Error("Model result is not an object");
  const name = str(o.name);
  const transcribedText = str(o.transcribedText);
  if (!name || !transcribedText) throw new Error("Model result is missing the name or the transcribed text");
  return {
    name,
    type: TYPES.includes(o.type) ? o.type : "other",
    variant: str(o.variant),
    listedPrice: str(o.listedPrice),
    transcribedText,
    unreadable: o.unreadable === true,
  };
}

export function buildGeminiBody(images) {
  return {
    contents: [{ role: "user", parts: [...images.map((i) => ({ inline_data: { mime_type: i.mime, data: i.data } })), { text: PROMPT }] }],
    generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA },
  };
}

export function parseGeminiResponse(json) {
  const c = json?.candidates?.[0];
  const text = c?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error(`Gemini returned no text (${json?.promptFeedback?.blockReason ?? c?.finishReason ?? "unknown reason"})`);
  return normalizeExtracted(JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    // Rate limit or temporary server trouble: wait and retry (15 s, 30 s, 60 s, 120 s).
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(15000 * 2 ** attempt);
      continue;
    }
    throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

export async function extractFromImages(files) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set.");
  const images = [];
  for (const f of files) {
    images.push({ mime: IMAGE_TYPES[path.extname(f).toLowerCase()], data: (await readFile(f)).toString("base64") });
  }
  return parseGeminiResponse(await callGemini(buildGeminiBody(images)));
}
