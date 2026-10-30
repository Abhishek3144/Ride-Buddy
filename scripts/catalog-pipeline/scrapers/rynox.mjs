const BASE_URL = 'https://rynoxgear.com';
const USER_AGENT = 'RidingBuddyCatalog/0.1 (polite product metadata collection; contact: project maintainer)';
const REQUEST_DELAY_MS = 1200;
const MAX_PAGES_PER_COLLECTION = 8;
const MAX_PRODUCTS_PER_SOURCE = 60;

/**
 * Rynox official-store HTML collector.
 * Reads public collection/product pages only; checks robots.txt first, uses a
 * conservative request rate, and does not execute scripts or bypass controls.
 */
export async function collectRynox(source, fetchedAt) {
  const domain = source.officialDomain;
  if (domain !== 'rynoxgear.com') throw new Error('Rynox scraper is restricted to rynoxgear.com');

  const robots = await loadRobots();
  const collectionUrls = source.collections ?? [];
  if (!collectionUrls.length) throw new Error('No collection URLs configured for Rynox');

  const productUrls = new Set();
  const collectionErrors = [];
  const collectionStats = [];
  let requestCount = 0;

  for (const configuredUrl of collectionUrls) {
    const collectionUrl = new URL(configuredUrl, BASE_URL);
    assertOfficialUrl(collectionUrl);
    if (!robotsAllowed(collectionUrl.pathname, robots)) {
      collectionErrors.push({ url: collectionUrl.toString(), error: 'Blocked by robots.txt; skipped' });
      continue;
    }

    let foundOnCollection = 0;
    let pagesFetched = 0;
    const pageStats = [];
    const seenPageFingerprints = new Set();
    for (let page = 1; page <= MAX_PAGES_PER_COLLECTION; page++) {
      const pageUrl = new URL(collectionUrl);
      if (page > 1) pageUrl.searchParams.set('page', String(page));
      if (!robotsAllowed(pageUrl.pathname, robots)) break;
      try {
        await politeDelay(requestCount++);
        const html = await fetchHtml(pageUrl);
        pagesFetched++;
        const links = extractProductLinks(html, pageUrl);
        const fingerprint = pageFingerprint(html);
        pageStats.push({
          page,
          htmlLength: html.length,
          title: getTitle(html).slice(0, 120),
          productLinksOnPage: links.length,
          uniqueProductLinksOnPage: new Set(links.map(normalizeProductUrl)).size,
          repeatedHtmlFingerprint: seenPageFingerprints.has(fingerprint),
          sampleProductUrls: links.slice(0, 6)
        });
        seenPageFingerprints.add(fingerprint);
        let added = 0;
        for (const link of links) {
          const normalized = normalizeProductUrl(link);
          if (!productUrls.has(normalized)) {
            productUrls.add(normalized);
            added++;
          }
        }
        foundOnCollection += links.length;
        // Continue through pages even when they repeat products already seen in
        // another collection. Stop only when this page has no product links.
        if (links.length === 0 || productUrls.size >= MAX_PRODUCTS_PER_SOURCE) break;
      } catch (error) {
        collectionErrors.push({ url: pageUrl.toString(), error: error.message });
        break;
      }
    }
    collectionStats.push({ url: collectionUrl.toString(), pagesFetched, productLinksSeen: foundOnCollection, pageStats });
    if (productUrls.size >= MAX_PRODUCTS_PER_SOURCE) break;
  }

  const products = [];
  const productErrors = [];
  for (const productUrl of [...productUrls].slice(0, MAX_PRODUCTS_PER_SOURCE)) {
    const url = new URL(productUrl);
    if (!robotsAllowed(url.pathname, robots)) {
      productErrors.push({ url: productUrl, error: 'Blocked by robots.txt; skipped' });
      continue;
    }
    try {
      await politeDelay(requestCount++);
      const html = await fetchHtml(url);
      const parsed = parseProductPage(html, url.toString(), fetchedAt);
      if (!parsed) {
        productErrors.push({ url: productUrl, error: 'Could not extract a product title from the page' });
        continue;
      }
      products.push({ ...parsed, brand: 'Rynox', url: productUrl, sourceRetrievedAt: fetchedAt });
    } catch (error) {
      productErrors.push({ url: productUrl, error: error.message });
    }
  }

  return {
    products,
    diagnostics: {
      collectionUrls: collectionUrls.length,
      discoveredProductUrls: productUrls.size,
      fetchedProducts: products.length,
      collectionErrors,
      collectionStats,
      productErrors,
      requestsMade: requestCount,
      note: 'Product data is unverified until reviewed. Collection scraping does not itself prove certification claims.'
    }
  };
}

async function loadRobots() {
  const url = `${BASE_URL}/robots.txt`;
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/plain,*/*;q=0.5' },
    signal: AbortSignal.timeout(12000),
    redirect: 'error'
  });
  if (response.status === 404 || response.status === 410) return { disallow: [], allow: [] };
  if (!response.ok) throw new Error(`Could not read robots.txt (HTTP ${response.status}); refusing to crawl without it`);
  return parseRobots(await response.text());
}

function parseRobots(text) {
  const groups = [];
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (!current || current.hasRules) {
        current = { agents: [], disallow: [], allow: [], hasRules: false };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (key === 'disallow' || key === 'allow')) {
      current.hasRules = true;
      if (value) current[key].push(value);
    }
  }
  const matching = groups.filter(g => g.agents.includes('*') || g.agents.some(a => USER_AGENT.toLowerCase().includes(a)));
  const exact = matching.filter(g => g.agents.some(a => a !== '*'));
  const selected = exact.length ? exact : matching;
  return { disallow: selected.flatMap(g => g.disallow), allow: selected.flatMap(g => g.allow) };
}

function robotsAllowed(pathname, robots) {
  const candidates = [
    ...robots.disallow.filter(rule => pathMatches(pathname, rule)).map(rule => ({ rule, allow: false })),
    ...robots.allow.filter(rule => pathMatches(pathname, rule)).map(rule => ({ rule, allow: true }))
  ].sort((a, b) => b.rule.length - a.rule.length);
  return candidates.length === 0 || candidates[0].allow;
}
function pathMatches(pathname, rule) {
  if (!rule) return false;
  const clean = rule.replace(/\*$/, '');
  return pathname.startsWith(clean);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language': 'en-IN,en;q=0.8'
    },
    signal: AbortSignal.timeout(15000),
    redirect: 'error'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) throw new Error(`Expected HTML, received ${contentType || 'unknown content type'}`);
  return response.text();
}

export function extractProductLinks(html, baseUrl) {
  const links = new Set();
  const anchorRegex = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>/gis;
  for (const match of html.matchAll(anchorRegex)) {
    const href = decodeHtml(match[2]).trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;
    try {
      const url = new URL(href, baseUrl);
      if (!['rynoxgear.com', 'www.rynoxgear.com'].includes(url.hostname.toLowerCase()) || !/^\/products\/[^/?#]+/.test(url.pathname)) continue;
      links.add(normalizeProductUrl(url.toString()));
    } catch { /* ignore malformed links */ }
  }
  return [...links];
}

export function parseProductPage(html, pageUrl, fetchedAt) {
  const canonical = getLinkHref(html, 'canonical') || pageUrl;
  const title = decodeHtml(getMeta(html, 'og:title') || getJsonLdProduct(html)?.name || getTitle(html)).trim();
  if (!title) return null;
  const jsonLd = getJsonLdProduct(html) || {};
  const description = stripHtml(getMeta(html, 'description') || getMeta(html, 'og:description') || jsonLd.description || '');
  const image = getMeta(html, 'og:image') || getMeta(html, 'twitter:image') || firstImage(jsonLd.image);
  const price = parsePrice(getMeta(html, 'product:price:amount') || getMeta(html, 'og:price:amount') || jsonLd.offers?.price || jsonLd.offers?.[0]?.price);
  const pageText = stripHtml(html);
  const type = inferType(`${title} ${getMeta(html, 'product:category') || ''}`);
  const certifications = extractCertifications(`${title}\n${description}\n${pageText}`, canonical);
  const materials = extractMaterials(`${description}\n${pageText}`);
  const offerAvailability = String(jsonLd.offers?.availability || jsonLd.offers?.[0]?.availability || '').toLowerCase();
  const availability = /outofstock|soldout|discontinued/.test(offerAvailability) ? 'unavailable-or-restocking' : /instock/.test(offerAvailability) ? 'in-stock' : null;
  const images = [...new Set([image, ...extractImageUrls(html)].filter(Boolean).map(v => absolutize(v, pageUrl)))].slice(0, 8);
  return {
    id: `rynox-${slugFromUrl(canonical)}`,
    name: cleanProductTitle(title),
    type,
    description: description || null,
    materials,
    ridingStyles: inferRidingStyles(`${title} ${description}`),
    certifications,
    images,
    price,
    currency: 'INR',
    availability,
    sourceEvidence: { pageUrl: canonical, retrievedAt: fetchedAt, extractionMethod: 'official-product-page-html', verificationStatus: 'needs-review' }
  };
}

function extractCertifications(text, evidenceUrl) {
  const found = [];
  const garmentClass = text.match(/EN\s*17092(?:[-:]\d{4})?\s*(?:Class\s*)?(AAA|AA|A)\b|CE[- ]certified\s+(?:to\s+)?(?:EN\s*17092\s*)?Class\s+(AAA|AA|A)\b|CE\s+standards[^.\n]{0,50}?Class\s+(AAA|AA|A)\b/i);
  const matchedClass = garmentClass?.[1] || garmentClass?.[2] || garmentClass?.[3];
  if (matchedClass) {
    found.push({ standard: 'EN 17092', class: matchedClass.toUpperCase(), level: null, component: 'garment', evidenceUrl });
  }
  const armorRegex = /(?:EN\s*1621[-– ]([123])(?:\s*:\s*\d{4})?[^.\n]{0,90}?(?:CE\s*)?Level\s*([12])|(?:CE\s*)?Level\s*([12])[^.\n]{0,90}?EN\s*1621[-– ]([123]))/gi;
  for (const match of text.matchAll(armorRegex)) {
    const standardPart = match[1] || match[4];
    const level = match[2] || match[3];
    const standard = `EN 1621-${standardPart}`;
    if (!found.some(c => c.standard === standard && c.level === level)) {
      found.push({ standard, class: null, level, component: 'impact-protector', evidenceUrl });
    }
  }
  return found;
}

function extractMaterials(text) {
  const materials = [];
  const patterns = [
    [/\bCordura\b/i, 'Cordura'],
    [/\bpolyester\b/i, 'Polyester'],
    [/\bpolyamide\b/i, 'Polyamide'],
    [/\bnylon\b/i, 'Nylon'],
    [/\bleather\b/i, 'Leather'],
    [/\bmesh\b/i, 'Mesh'],
    [/\bdenim\b/i, 'Denim'],
    [/\bKevlar\b/i, 'Kevlar'],
    [/\bspandex\b/i, 'Spandex'],
    [/\bpolyurethane\b|\bPU[- ]coated\b/i, 'Polyurethane/PU']
  ];
  for (const [regex, label] of patterns) if (regex.test(text) && !materials.includes(label)) materials.push(label);
  return materials;
}

function inferType(text) {
  const s = text.toLowerCase();
  if (/helmet/.test(s)) return 'helmets';
  if (/glove/.test(s)) return 'gloves';
  if (/jacket|coat/.test(s)) return 'jackets';
  if (/pant|trouser|jean/.test(s)) return 'pants';
  if (/boot|shoe/.test(s)) return 'shoes';
  if (/protector|armor|armour|knee guard/.test(s)) return 'armor';
  if (/suit/.test(s)) return 'suits';
  return 'other';
}
function inferRidingStyles(text) {
  const s = text.toLowerCase();
  const styles = [];
  if (/city|commut|urban/.test(s)) styles.push('city');
  if (/tour|highway|long distance|weekend ride/.test(s)) styles.push('touring');
  if (/off.?road|adventure|dirt|rally/.test(s)) styles.push('offroad');
  return [...new Set(styles)];
}
function getJsonLdProduct(html) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1].trim());
      const candidates = Array.isArray(data) ? data : [data, ...(data['@graph'] || [])];
      const product = candidates.find(item => item && (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))));
      if (product) return product;
    } catch { /* ignore malformed structured data */ }
  }
  return null;
}
function getMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexes = [
    new RegExp(`<meta\\b[^>]*\\bname=["']${escaped}["'][^>]*\\bcontent=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\b[^>]*\\bproperty=["']${escaped}["'][^>]*\\bcontent=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\b[^>]*\\bcontent=["']([^"']*)["'][^>]*\\b(?:name|property)=["']${escaped}["'][^>]*>`, 'i')
  ];
  for (const regex of regexes) { const match = html.match(regex); if (match) return decodeHtml(match[1]); }
  return '';
}
function getLinkHref(html, rel) {
  const match = html.match(new RegExp(`<link\\b(?=[^>]*\\brel=["']${rel}["'])(?=[^>]*\\bhref=["']([^"']+)["'])[^>]*>`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}
function getTitle(html) { return decodeHtml((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim(); }
function extractImageUrls(html) {
  const values = [];
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const src = tag.match(/\b(?:src|data-src|data-original)=["']([^"']+)["']/i)?.[1];
    if (src && isLikelyProductImage(src)) values.push(decodeHtml(src));
    const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1];
    if (srcset) { const candidate = decodeHtml(srcset.split(',')[0].trim().split(/\s+/)[0]); if (isLikelyProductImage(candidate)) values.push(candidate); }
  }
  return values;
}
function isLikelyProductImage(value) {
  if (!value || /^data:/i.test(value)) return false;
  const s = String(value).toLowerCase();
  if (/logo|navicon|newicon|\bicon[-_]|hover|payment|social|flag|badge/.test(s)) return false;
  return /\.(?:png|jpe?g|webp|avif)(?:[?#]|$)/i.test(s) || /\/cdn\/shop\/(?:files|products)\//i.test(s);
}
function firstImage(image) { return Array.isArray(image) ? (typeof image[0] === 'string' ? image[0] : image[0]?.url) : typeof image === 'string' ? image : image?.url; }
function parsePrice(value) {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}
function stripHtml(value) {
  return decodeHtml(String(value || '').replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}
function decodeHtml(value) {
  return String(value || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function cleanProductTitle(value) { return String(value).replace(/\s*[–|]\s*Rynox Gear.*$/i, '').replace(/\s+/g, ' ').trim(); }
function normalizeProductUrl(value) { const url = new URL(value, BASE_URL); url.hostname = 'rynoxgear.com'; url.protocol = 'https:'; url.hash = ''; url.search = ''; return url.toString().replace(/\/$/, ''); }
function pageFingerprint(value) { let hash = 2166136261; for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16); }
function absolutize(value, base) { try { return new URL(value, base).toString(); } catch { return ''; } }
function assertOfficialUrl(url) { if (url.protocol !== 'https:' || url.hostname !== 'rynoxgear.com') throw new Error(`Refusing non-official or non-HTTPS URL: ${url}`); }
function slugFromUrl(value) { return new URL(value).pathname.split('/').filter(Boolean).pop().toLowerCase().replace(/[^a-z0-9-]/g, '-'); }
function politeDelay(requestCount) { return requestCount === 0 ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS)); }
