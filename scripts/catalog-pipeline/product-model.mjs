const asArray = (value) => Array.isArray(value) ? value : value == null || value === '' ? [] : [value];

export function normalizeProduct(raw, source, fetchedAt = new Date().toISOString()) {
  const productUrl = raw?.url ?? raw?.productUrl ?? raw?.product_url ?? '';
  const imageUrls = asArray(raw?.images ?? raw?.image ?? raw?.imageUrl ?? raw?.image_url).map(v => typeof v === 'string' ? v : v?.url).filter(Boolean);
  const certificationInput = raw?.certifications ?? raw?.certification ?? [];
  const certifications = asArray(certificationInput).map((c) => {
    if (typeof c === 'string') return { standard: c, class: null, level: null, component: 'unspecified', evidenceUrl: null };
    return {
      standard: c?.standard ?? c?.name ?? null,
      class: c?.class ?? c?.classRating ?? null,
      level: c?.level == null ? null : String(c.level),
      component: c?.component ?? 'unspecified',
      evidenceUrl: c?.evidenceUrl ?? c?.evidence_url ?? null
    };
  });
  return {
    id: raw?.id ? String(raw.id) : `${source.id}-${slug(raw?.name || 'product')}`,
    name: String(raw?.name ?? raw?.title ?? '').trim(),
    brand: String(raw?.brand ?? source.brand ?? '').trim(),
    type: normalizeType(raw?.type ?? raw?.category ?? source.defaultType),
    variant: raw?.variant ?? null,
    description: raw?.description ?? null,
    materials: asArray(raw?.materials ?? raw?.material).map(String),
    ridingStyles: asArray(raw?.ridingStyles ?? raw?.riding_styles ?? source.defaultRidingStyles).map(normalizeStyle).filter(Boolean),
    certifications,
    images: imageUrls,
    price: parsePrice(raw?.price ?? raw?.priceInr ?? raw?.price_inr),
    currency: raw?.currency ?? 'INR',
    availability: raw?.availability ?? null,
    source: {
      sourceId: source.id,
      sourceType: source.type,
      brand: source.brand ?? null,
      officialDomain: source.officialDomain,
      productUrl: canonicalize(productUrl, source.officialDomain),
      recordUrl: source.endpoint ?? raw?.sourceEvidence?.pageUrl ?? productUrl,
      extractionMethod: raw?.sourceEvidence?.extractionMethod ?? (source.type === 'manual-entry' ? 'manual-official-source' : 'json-source'),
      retrievedAt: fetchedAt,
      lastVerifiedAt: raw?.lastVerifiedAt ?? null,
      verificationStatus: raw?.verificationStatus ?? 'needs-review'
    }
  };
}

export function validateProduct(p) {
  const errors = [];
  if (!p.name) errors.push('Missing product name');
  if (!p.brand) errors.push('Missing brand');
  if (!['helmets', 'jackets', 'gloves', 'pants', 'shoes', 'armor', 'suits', 'other'].includes(p.type)) errors.push(`Unsupported type: ${p.type || '(empty)'}`);
  if (!p.source?.productUrl) errors.push('Missing product URL');
  if (p.source?.productUrl && !isHttpUrl(p.source.productUrl)) errors.push('Product URL must be a valid HTTP(S) URL');
  if (p.source?.productUrl && p.source?.officialDomain) {
    try { if (new URL(p.source.productUrl).hostname !== p.source.officialDomain) errors.push('Product URL host does not match officialDomain'); }
    catch { errors.push('Invalid product URL'); }
  }
  for (const [i, c] of p.certifications.entries()) {
    if (!c.standard) errors.push(`Certification ${i + 1}: missing standard name`);
    if (c.level && !['1', '2'].includes(c.level)) errors.push(`Certification ${i + 1}: expected level 1 or 2 when level is supplied`);
  }
  for (const url of p.images) if (!isHttpUrl(url)) errors.push(`Invalid image URL: ${url}`);
  if (p.price != null && (!Number.isFinite(p.price) || p.price < 0)) errors.push('Price must be a non-negative number');
  return errors;
}

function canonicalize(value, domain) {
  if (!value) return '';
  try {
    const url = new URL(value, `https://${domain}`);
    url.hash = '';
    return url.toString();
  } catch { return ''; }
}
function isHttpUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
function parsePrice(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return value;
  const parsed = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function normalizeType(value) {
  const v = String(value ?? '').toLowerCase();
  if (['helmet', 'helmets'].includes(v)) return 'helmets';
  if (['jacket', 'jackets'].includes(v)) return 'jackets';
  if (['glove', 'gloves'].includes(v)) return 'gloves';
  if (['pant', 'pants', 'trousers', 'jeans'].includes(v)) return 'pants';
  if (['shoe', 'shoes', 'boot', 'boots', 'riding shoes'].includes(v)) return 'shoes';
  if (['armor', 'armour', 'protector', 'protectors'].includes(v)) return 'armor';
  if (['suit', 'suits', 'racing suit'].includes(v)) return 'suits';
  return v ? 'other' : '';
}
function normalizeStyle(value) {
  const v = String(value).toLowerCase().trim();
  if (['city', 'commute', 'commuting', 'urban'].includes(v)) return 'city';
  if (['touring', 'highway', 'long tour', 'long-distance'].includes(v)) return 'touring';
  if (['offroad', 'off-road', 'adventure', 'dirt'].includes(v)) return 'offroad';
  return null;
}
