import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeProduct, validateProduct } from './product-model.mjs';
import { collectRynox } from './scrapers/rynox.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '../..');
const sourceFile = path.join(here, 'sources.json');
const stagingDir = path.join(projectRoot, 'catalog', 'staging');
const outputDir = path.join(projectRoot, 'catalog', 'output');
const logDir = path.join(projectRoot, 'catalog', 'logs');
const timestamp = new Date().toISOString();

await Promise.all([fs.mkdir(stagingDir, { recursive: true }), fs.mkdir(outputDir, { recursive: true }), fs.mkdir(logDir, { recursive: true })]);
const registry = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
const products = [];
const runLog = { startedAt: timestamp, sourceResults: [], acceptedProducts: 0, rejectedProducts: 0 };

for (const source of registry.sources ?? []) {
  if (!source.enabled) {
    runLog.sourceResults.push({ sourceId: source.id, status: 'skipped', reason: 'Source is disabled' });
    continue;
  }
  if (source.type === 'website-scraper') {
    if (source.scraper !== 'rynox' || !source.officialDomain) {
      runLog.sourceResults.push({ sourceId: source.id, status: 'error', reason: 'Unsupported scraper or missing officialDomain' });
      continue;
    }
    try {
      const result = await collectRynox(source, timestamp);
      let accepted = 0;
      let rejected = 0;
      const issues = [];
      for (const raw of result.products) {
        const product = normalizeProduct(raw, source, timestamp);
        const errors = validateProduct(product);
        if (errors.length) {
          rejected++;
          issues.push({ productName: product.name || null, productUrl: raw.url || null, errors });
        } else {
          products.push(product);
          accepted++;
        }
      }
      const sourceSlug = source.id.replace(/[^a-z0-9-_]/gi, '-');
      await fs.writeFile(path.join(stagingDir, `${sourceSlug}.json`), JSON.stringify({ sourceId: source.id, fetchedAt: timestamp, accepted, rejected, issues, diagnostics: result.diagnostics, products: products.filter(p => p.source.sourceId === source.id) }, null, 2));
      runLog.acceptedProducts += accepted;
      runLog.rejectedProducts += rejected;
      runLog.sourceResults.push({ sourceId: source.id, status: 'success', fetched: result.products.length, accepted, rejected, diagnostics: result.diagnostics });
    } catch (error) {
      runLog.sourceResults.push({ sourceId: source.id, status: 'error', reason: error.message });
    }
    continue;
  }
  if (source.type !== 'json-api' && source.type !== 'json-feed') {
    runLog.sourceResults.push({ sourceId: source.id, status: 'error', reason: `Unsupported source type: ${source.type}` });
    continue;
  }
  if (!source.endpoint || !source.officialDomain) {
    runLog.sourceResults.push({ sourceId: source.id, status: 'error', reason: 'endpoint and officialDomain are required' });
    continue;
  }
  let endpoint;
  try {
    endpoint = new URL(source.endpoint);
  } catch {
    runLog.sourceResults.push({ sourceId: source.id, status: 'error', reason: 'Invalid endpoint URL' });
    continue;
  }
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== source.officialDomain) {
    runLog.sourceResults.push({ sourceId: source.id, status: 'error', reason: 'Endpoint must use HTTPS and match the configured officialDomain exactly' });
    continue;
  }

  try {
    const response = await fetch(endpoint, {
      headers: { accept: 'application/json', 'user-agent': 'RidingBuddyCatalog/0.1 (official product data ingestion)' },
      signal: AbortSignal.timeout(15000),
      redirect: 'manual'
    });
    if (response.status >= 300 && response.status < 400) throw new Error('Redirect refused. Configure the final official HTTPS endpoint directly.');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const records = source.itemsPath ? source.itemsPath.split('.').reduce((v, key) => v?.[key], payload) : payload;
    if (!Array.isArray(records)) throw new Error('Response must be a JSON array, or itemsPath must point to an array');

    let accepted = 0;
    let rejected = 0;
    const issues = [];
    for (const raw of records) {
      const product = normalizeProduct(raw, source, timestamp);
      const errors = validateProduct(product);
      if (errors.length) {
        rejected++;
        issues.push({ productName: product.name || raw?.name || null, errors });
      } else {
        products.push(product);
        accepted++;
      }
    }
    const sourceSlug = source.id.replace(/[^a-z0-9-_]/gi, '-');
    await fs.writeFile(path.join(stagingDir, `${sourceSlug}.json`), JSON.stringify({ sourceId: source.id, fetchedAt: timestamp, accepted, rejected, issues, products: products.filter(p => p.source.sourceId === source.id) }, null, 2));
    runLog.acceptedProducts += accepted;
    runLog.rejectedProducts += rejected;
    runLog.sourceResults.push({ sourceId: source.id, status: 'success', fetched: records.length, accepted, rejected });
  } catch (error) {
    runLog.sourceResults.push({ sourceId: source.id, status: 'error', reason: error.message });
  }
}

// Deduplicate on brand + canonical product URL; do not silently merge different variants.
const unique = new Map();
for (const product of products) {
  const key = `${product.brand.toLowerCase()}|${product.source.productUrl}`;
  if (!unique.has(key)) unique.set(key, product);
}
const finalProducts = [...unique.values()];
await fs.writeFile(path.join(outputDir, 'catalog.generated.json'), JSON.stringify({ generatedAt: timestamp, count: finalProducts.length, products: finalProducts }, null, 2));
await fs.writeFile(path.join(logDir, `run-${timestamp.replace(/[:.]/g, '-')}.json`), JSON.stringify(runLog, null, 2));
console.log(`Catalog collection complete: ${finalProducts.length} valid product(s).`);
console.log(`Configured sources: ${(registry.sources ?? []).length}. Review catalog/logs for per-source results.`);
if (!(registry.sources ?? []).some(s => s.enabled)) console.log('No sources enabled. Configure a supported source in scripts/catalog-pipeline/sources.json.');
