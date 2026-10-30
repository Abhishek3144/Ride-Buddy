import { loadManualCatalogs, summarizeCatalog, validateManualCatalogs } from './manual-catalog.mjs';

const { catalogs, errors: loadErrors } = await loadManualCatalogs();
const { errors: validationErrors } = validateManualCatalogs(catalogs);
const summaries = catalogs.map(summarizeCatalog);
const total = summaries.reduce((sum, row) => sum + row.products, 0);
const verified = summaries.reduce((sum, row) => sum + row.verified, 0);
const needsReview = summaries.reduce((sum, row) => sum + row.needsReview, 0);

console.log('Manual catalog progress');
console.log('Brand file                         Products  Verified  Needs review');
console.log('---------------------------------------------------------------');
for (const row of summaries) console.log(`${row.file.padEnd(34)} ${String(row.products).padStart(8)} ${String(row.verified).padStart(9)} ${String(row.needsReview).padStart(13)}`);
console.log('---------------------------------------------------------------');
console.log(`Total: ${catalogs.length} brand file(s), ${total} product(s), ${verified} verified, ${needsReview} needing review.`);
console.log(`Validation issues: ${loadErrors.length + validationErrors.length}.`);
if (!catalogs.length) console.log('Next: copy catalog/manual/brand-template.json to a brand-specific filename and enter products.');
if (loadErrors.length + validationErrors.length) process.exitCode = 1;
