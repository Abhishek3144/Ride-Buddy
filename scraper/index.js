import { mkdir, writeFile } from "node:fs/promises";
import { BRANDS } from "./config.js";
import { getRobots } from "./lib/http.js";
import { fetchShopifyProducts } from "./lib/shopify.js";
import { normalizeProduct } from "./lib/normalize.js";

const key = process.argv[2];
const brand = BRANDS[key];
if (!brand) {
  console.error(`Usage: npm run scrape <${Object.keys(BRANDS).join("|")}>`);
  process.exit(1);
}
if (!brand.baseUrl) {
  console.error(`No base URL for ${brand.name}. Confirm the official store URL, then set it (see config.js).`);
  process.exit(1);
}

try {
  const robots = await getRobots(brand.baseUrl);
  const raw = await fetchShopifyProducts(brand.baseUrl, robots);

  const skipped = [];
  const items = [];
  for (const p of raw) {
    const n = normalizeProduct(p, brand.name, brand.baseUrl);
    n ? items.push(n) : skipped.push(p.title);
  }

  await mkdir("output/raw", { recursive: true });
  await writeFile(`output/raw/${key}.json`, JSON.stringify(raw, null, 2));
  await writeFile(`output/${key}.normalized.json`, JSON.stringify(items, null, 2));

  const byType = {};
  for (const i of items) byType[i.type] = (byType[i.type] ?? 0) + 1;
  console.log(`${brand.name}: ${raw.length} products fetched, ${items.length} kept, ${skipped.length} skipped`);
  console.log("By type:", byType);
  console.log(`Certification stated on the page: ${items.filter((i) => i.certification).length}/${items.length}`);
  console.log("Sample of skipped titles:", skipped.slice(0, 10));
  console.log(`Review output/${key}.normalized.json (see "needsReview") before loading it anywhere.`);
} catch (err) {
  console.error(`Stopped: ${err.message}`);
  console.error("If this store isn't Shopify (no /products.json), it needs an HTML adapter instead.");
  process.exit(1);
}
