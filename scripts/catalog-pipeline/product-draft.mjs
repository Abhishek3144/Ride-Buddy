export function parseEmbeddedProduct(sourceText) {
  const marker = /\b(?:var|let|const)\s+product\s*=\s*/i.exec(sourceText);
  if (!marker) throw new Error('Could not find a "var product = {...}" block in the source file.');
  const start = sourceText.indexOf('{', marker.index + marker[0].length);
  if (start < 0) throw new Error('The product assignment does not contain a JSON object.');

  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < sourceText.length; index++) {
    const character = sourceText[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (character === '{') depth++;
    if (character === '}') {
      depth--;
      if (depth === 0) {
        const objectText = sourceText.slice(start, index + 1);
        try { return JSON.parse(objectText); }
        catch (error) { throw new Error(`The extracted product object is not valid JSON: ${error.message}`); }
      }
    }
  }
  throw new Error('The product object ends unexpectedly. Copy the complete "var product" block from page source.');
}

export function createProductDraft(product, { brand, domain, type, verifiedAt = new Date().toISOString() }) {
  const officialDomain = normalizeDomain(domain);
  const title = String(product.title ?? product.name ?? '').trim();
  const handle = String(product.handle ?? '').trim();
  if (!title) throw new Error('The source product is missing a title.');
  if (!handle) throw new Error('The source product is missing a handle; enter the product URL manually instead.');
  const description = htmlToText(product.description ?? product.content ?? '');
  const images = unique((product.media ?? product.images ?? [])
    .map((media) => typeof media === 'string' ? media : media?.src ?? media?.preview_image?.src)
    .map((url) => absoluteUrl(url, officialDomain))
    .filter(Boolean));
  const price = Number(product.price);
  const inferredType = type || inferType(`${title} ${product.type ?? ''}`);
  const materials = inferMaterials(description);
  const ridingStyles = inferRidingStyles(`${title} ${description}`);
  const productUrl = `https://${officialDomain}/products/${encodeURIComponent(handle)}`;

  return {
    id: `${slug(brand)}-${slug(handle)}`,
    name: title,
    type: inferredType,
    variant: null,
    description: description || null,
    materials,
    ridingStyles,
    certifications: [],
    images: images.slice(0, 6),
    price: Number.isFinite(price) ? price / 100 : null,
    currency: product.currency ?? 'INR',
    availability: product.available === true ? 'in-stock' : product.available === false ? 'unavailable' : null,
    productUrl,
    sourceUrl: productUrl,
    lastVerifiedAt: verifiedAt,
    verificationStatus: 'needs-review',
    reviewNotes: [
      'Draft created from manually copied official page source.',
      'Review materials, riding styles, price, availability, images, and every certification claim before changing verificationStatus to verified.',
      'Certifications are intentionally empty; add only explicit, source-backed certification details.'
    ],
    sourceProductId: product.id == null ? null : String(product.id),
    sourceVariants: (product.variants ?? []).map((variant) => ({
      name: variant.public_title ?? variant.title ?? null,
      sku: variant.sku ?? null,
      available: variant.available ?? null,
      price: Number.isFinite(Number(variant.price)) ? Number(variant.price) / 100 : null
    }))
  };
}

export function slug(value) { return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function normalizeDomain(value) {
  const domain = String(value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!domain || /[/?#]/.test(domain)) throw new Error('Provide a plain official domain, for example rynoxgear.com.');
  return domain;
}
function absoluteUrl(value, domain) {
  if (!value) return null;
  if (String(value).startsWith('//')) return `https:${value}`;
  try { return new URL(value, `https://${domain}`).toString(); } catch { return null; }
}
function htmlToText(value) {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500);
}
function inferType(value) {
  const text = String(value).toLowerCase();
  if (/glove/.test(text)) return 'gloves';
  if (/helmet/.test(text)) return 'helmets';
  if (/jacket/.test(text)) return 'jackets';
  if (/pant|trouser|jean/.test(text)) return 'pants';
  if (/boot|shoe/.test(text)) return 'shoes';
  if (/armor|armour|protect/.test(text)) return 'armor';
  if (/suit/.test(text)) return 'suits';
  return 'other';
}
function inferMaterials(value) {
  const text = String(value).toLowerCase();
  return [
    ['full-grain leather', 'Full-grain leather'],
    ['leather', 'Leather'],
    ['suede', 'Suede'],
    ['mesh', 'Mesh'],
    ['polyester', 'Polyester'],
    ['cordura', 'Cordura'],
    ['nylon', 'Nylon']
  ].filter(([needle]) => text.includes(needle)).map(([, material]) => material).filter((material, index, values) => material !== 'Leather' || !values.includes('Full-grain leather'));
}
function inferRidingStyles(value) {
  const text = String(value).toLowerCase();
  return [
    [/off[ -]?road|dirt|adventure/, 'offroad'],
    [/touring|highway|long.distance/, 'touring'],
    [/urban|city|commut/, 'city']
  ].filter(([pattern]) => pattern.test(text)).map(([, style]) => style);
}
function unique(values) { return [...new Set(values)]; }
