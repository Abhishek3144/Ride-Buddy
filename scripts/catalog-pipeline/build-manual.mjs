import fs from 'node:fs/promises';
import path from 'node:path';
import { loadManualCatalogs, projectRoot, validateManualCatalogs } from './manual-catalog.mjs';

const { catalogs, errors: loadErrors } = await loadManualCatalogs();
const { products, errors: validationErrors } = validateManualCatalogs(catalogs);
const errors = [...loadErrors, ...validationErrors];
if (errors.length) {
  console.error(`Manual catalog build stopped: ${errors.length} validation issue(s). Run npm run catalog:manual:validate for details.`);
  process.exit(1);
}

const timestamp = new Date().toISOString();
const outputDir = path.join(projectRoot, 'catalog', 'output');
const stagingDir = path.join(projectRoot, 'catalog', 'staging');
const logDir = path.join(projectRoot, 'catalog', 'logs');
await Promise.all([fs.mkdir(outputDir, { recursive: true }), fs.mkdir(stagingDir, { recursive: true }), fs.mkdir(logDir, { recursive: true })]);

for (const catalog of catalogs) {
  const catalogProducts = products.filter((product) => product.source.sourceId === `manual-${catalog.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`);
  const filename = catalog.file.replace(/\.json$/i, '');
  await fs.writeFile(path.join(stagingDir, `${filename}.validated.json`), JSON.stringify({ brand: catalog.brand, builtAt: timestamp, count: catalogProducts.length, products: catalogProducts }, null, 2));
}
await fs.writeFile(path.join(outputDir, 'catalog.generated.json'), JSON.stringify({ generatedAt: timestamp, count: products.length, products }, null, 2));
await fs.writeFile(path.join(logDir, `manual-run-${timestamp.replace(/[:.]/g, '-')}.json`), JSON.stringify({ startedAt: timestamp, mode: 'manual-entry', brandFiles: catalogs.map((catalog) => catalog.file), acceptedProducts: products.length, rejectedProducts: 0 }, null, 2));
console.log(`Manual catalog build complete: ${products.length} valid product(s) from ${catalogs.length} brand file(s).`);
