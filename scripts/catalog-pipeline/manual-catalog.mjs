import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeProduct, validateProduct } from './product-model.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(here, '../..');
export const manualDir = path.join(projectRoot, 'catalog', 'manual');

export async function loadManualCatalogs() {
  await fs.mkdir(manualDir, { recursive: true });
  const files = (await fs.readdir(manualDir)).filter((file) => file.endsWith('.json') && file !== 'brand-template.json').sort();
  const catalogs = [];
  const errors = [];

  for (const file of files) {
    const filePath = path.join(manualDir, file);
    let data;
    try {
      data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
      errors.push({ file, errors: [`Invalid JSON: ${error.message}`] });
      continue;
    }
    const catalogErrors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) catalogErrors.push('The file must contain one JSON object');
    if (!String(data?.brand ?? '').trim()) catalogErrors.push('Missing brand');
    if (!String(data?.officialDomain ?? '').trim()) catalogErrors.push('Missing officialDomain');
    if (!Array.isArray(data?.products)) catalogErrors.push('products must be an array');
    if (catalogErrors.length) {
      errors.push({ file, errors: catalogErrors });
      continue;
    }
    catalogs.push({ file, filePath, ...data });
  }
  return { catalogs, errors };
}

export function validateManualCatalogs(catalogs) {
  const errors = [];
  const products = [];
  const seen = new Map();

  for (const catalog of catalogs) {
    const source = {
      id: `manual-${slug(catalog.brand)}`,
      type: 'manual-entry',
      brand: catalog.brand.trim(),
      officialDomain: catalog.officialDomain.trim().toLowerCase()
    };
    for (const [index, raw] of catalog.products.entries()) {
      const itemErrors = [];
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        errors.push({ file: catalog.file, index, name: null, errors: ['Product must be an object'] });
        continue;
      }
      if (!String(raw.sourceUrl ?? raw.sourceEvidence?.pageUrl ?? '').trim()) itemErrors.push('Missing sourceUrl (the official page supporting this entry)');
      const verifiedAt = raw.lastVerifiedAt;
      if (!verifiedAt || Number.isNaN(Date.parse(verifiedAt))) itemErrors.push('lastVerifiedAt must be an ISO date');
      if (!['verified', 'needs-review'].includes(raw.verificationStatus)) itemErrors.push('verificationStatus must be verified or needs-review');
      const sourceUrl = raw.sourceUrl ?? raw.sourceEvidence?.pageUrl;
      if (sourceUrl && !isOfficialHttpUrl(sourceUrl, source.officialDomain)) itemErrors.push('sourceUrl must be an HTTP(S) URL on the configured officialDomain');

      const product = normalizeProduct({
        ...raw,
        brand: raw.brand ?? source.brand,
        url: raw.productUrl ?? raw.url,
        sourceEvidence: { ...(raw.sourceEvidence ?? {}), pageUrl: sourceUrl, extractionMethod: 'manual-official-source' }
      }, source, raw.lastVerifiedAt);
      itemErrors.push(...validateProduct(product));
      const key = `${product.brand.toLowerCase()}|${product.source.productUrl}`;
      if (seen.has(key)) itemErrors.push(`Duplicate product URL; already used in ${seen.get(key)}`);
      else if (product.brand && product.source.productUrl) seen.set(key, `${catalog.file} product ${index + 1}`);

      if (itemErrors.length) errors.push({ file: catalog.file, index, name: product.name || null, errors: itemErrors });
      else products.push(product);
    }
  }
  return { products, errors };
}

export function summarizeCatalog(catalog) {
  const products = catalog.products ?? [];
  const statuses = products.reduce((summary, product) => {
    const status = product?.verificationStatus ?? 'unclassified';
    summary[status] = (summary[status] ?? 0) + 1;
    return summary;
  }, {});
  return { file: catalog.file, brand: catalog.brand, products: products.length, verified: statuses.verified ?? 0, needsReview: statuses['needs-review'] ?? 0 };
}

function isOfficialHttpUrl(value, officialDomain) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname === officialDomain;
  } catch { return false; }
}
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
