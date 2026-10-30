import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { BRAND_NAMES, IMAGE_TYPES, MAX_IMAGES, DELAY_MS } from "./config.js";
import { extractFromImages } from "./lib/extract.js";
import { buildRecord, applyOverrides } from "./lib/build.js";
import { toCsv, toSql } from "./lib/export.js";

const [cmd, arg, ...flags] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => stat(p).then(() => true, () => false);
const dirs = async (p) => (await readdir(p, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

async function extract(brandKey, force) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set. See README step 2.");
  const brandDir = path.join("inbox", brandKey);
  if (!(await exists(brandDir))) throw new Error(`No folder ${brandDir}. Put one subfolder per product inside it.`);
  const brand = BRAND_NAMES[brandKey] ?? brandKey;
  await mkdir(path.join("staging", brandKey), { recursive: true });

  for (const slug of await dirs(brandDir)) {
    const out = path.join("staging", brandKey, `${slug}.json`);
    if (!force && (await exists(out))) { console.log(`skip   ${slug} (already extracted)`); continue; }
    const files = (await readdir(path.join(brandDir, slug)))
      .filter((f) => IMAGE_TYPES[path.extname(f).toLowerCase()]).sort().slice(0, MAX_IMAGES);
    if (!files.length) { console.log(`skip   ${slug} (no images)`); continue; }
    try {
      const extracted = await extractFromImages(files.map((f) => path.join(brandDir, slug, f)));
      await writeFile(out, JSON.stringify({ brand, slug, imageFiles: files, extractedAt: new Date().toISOString(), extracted, overrides: {} }, null, 2));
      console.log(`done   ${slug}${extracted.unreadable ? "  (some text unreadable)" : ""}`);
    } catch (err) {
      console.error(`FAILED ${slug}: ${err.message}`);
    }
    await sleep(DELAY_MS);
  }
}

async function exportAll() {
  const records = [];
  for (const brandKey of await dirs("staging").catch(() => [])) {
    for (const f of (await readdir(path.join("staging", brandKey))).filter((x) => x.endsWith(".json")).sort()) {
      const s = JSON.parse(await readFile(path.join("staging", brandKey, f), "utf8"));
      const rec = buildRecord({ brand: s.brand, slug: s.slug, extracted: s.extracted, imageFiles: s.imageFiles, now: s.extractedAt });
      records.push(applyOverrides(rec, s.overrides));
    }
  }
  await mkdir("output", { recursive: true });
  await writeFile("output/gear.csv", toCsv(records));
  await writeFile("output/gear.sql", toSql(records));

  const flagged = {};
  for (const r of records) for (const f of r.needsReview) flagged[f] = (flagged[f] ?? 0) + 1;
  console.log(`${records.length} products -> output/gear.csv, output/gear.sql`);
  console.log(`Rating stated: ${records.filter((r) => r.certification).length}/${records.length}`);
  console.log("Still needs review:", flagged);
}

try {
  if (cmd === "extract" && arg) await extract(arg, flags.includes("--force"));
  else if (cmd === "export") await exportAll();
  else console.log("Usage:\n  npm run extract <brand> [-- --force]\n  npm run export");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
