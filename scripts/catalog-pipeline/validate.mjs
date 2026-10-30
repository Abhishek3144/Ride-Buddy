import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProduct } from './product-model.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const input = path.join(root, 'catalog', 'output', 'catalog.generated.json');
let payload;
try { payload = JSON.parse(await fs.readFile(input, 'utf8')); }
catch (e) { console.error(`Cannot read generated catalog. Run npm run catalog:manual:build first. ${e.message}`); process.exit(1); }
let failed = 0;
for (const product of payload.products ?? []) {
  const errors = validateProduct(product);
  if (errors.length) {
    failed++;
    console.error(`\n${product.brand || 'Unknown brand'} / ${product.name || 'Unnamed product'}\n- ${errors.join('\n- ')}`);
  }
}
console.log(`Validated ${payload.products?.length ?? 0} product(s); ${failed} invalid product(s).`);
if (failed) process.exitCode = 1;
