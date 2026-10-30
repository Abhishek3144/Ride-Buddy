import assert from 'node:assert/strict';
import { extractProductLinks, parseProductPage } from './scrapers/rynox.mjs';
import { normalizeProduct, validateProduct } from './product-model.mjs';

const normalizedProduct = normalizeProduct(
  {
    name: 'Model import verification gloves',
    category: 'gloves',
    url: 'https://rynoxgear.com/products/model-import-verification'
  },
  {
    id: 'rynox-model-import-verification',
    brand: 'Rynox',
    type: 'website-scraper',
    officialDomain: 'rynoxgear.com'
  },
  '2026-10-23T00:00:00.000Z'
);
assert.deepEqual(validateProduct(normalizedProduct), [], 'product model imports and produces a valid normalized product');

const collectionHtml = `
<html><body>
<a href="/products/rynox-air-gt-riding-pant">Air GT Pants</a>
<a href="https://rynoxgear.com/products/rynox-air-gt-riding-pant?variant=123">Variant link</a>
<a href="/products/another-jacket">Jacket</a>
<a href="https://example.com/products/not-rynox">External</a>
</body></html>`;
const links = extractProductLinks(collectionHtml, 'https://rynoxgear.com/collections/riding-pants');
assert.equal(links.length, 2, 'extracts unique official product links');

const productHtml = `
<html><head>
<title>AIR GT PANTS – Rynox Gear</title>
<link rel="canonical" href="https://rynoxgear.com/products/rynox-air-gt-riding-pant">
<meta property="og:title" content="AIR GT PANTS – Rynox Gear">
<meta property="og:description" content="Touring pants with 600D PU coated polyester and CE Level 2 protectors certified to EN 1621-1:2012.">
<meta property="product:price:amount" content="6150.00">
<meta property="og:image" content="//rynoxgear.com/cdn/shop/files/air-gt-pants.jpg">
</head><body>
<h1>AIR GT PANTS</h1>
<p>CE Level 2 protectors certified to standard EN 1621-1:2012.</p>
<p>Heavy Duty Textile: 600D PU coated polyester.</p>
</body></html>`;
const product = parseProductPage(productHtml, 'https://rynoxgear.com/products/rynox-air-gt-riding-pant', '2026-10-10T00:00:00.000Z');
assert.equal(product.name, 'AIR GT PANTS');
assert.equal(product.type, 'pants');
assert.equal(product.price, 6150);
assert.ok(product.images[0].startsWith('https://rynoxgear.com/'));
assert.ok(product.certifications.some(c => c.standard === 'EN 1621-1' && c.level === '2'));
assert.ok(product.materials.includes('Polyester'));
const garmentClassProduct = parseProductPage(`<html><head><title>OUTLANDER PRO JACKET - CE CERTIFIED CLASS AA</title><meta property="og:title" content="OUTLANDER PRO JACKET - CE CERTIFIED CLASS AA"></head><body>CE certified Class AA. EN 17092.</body></html>`, 'https://rynoxgear.com/products/outlander-pro-jacket', '2026-10-10T00:00:00.000Z');
assert.ok(garmentClassProduct.certifications.some(c => c.standard === 'EN 17092' && c.class === 'AA'));
const unverifiedClassProduct = parseProductPage(`<html><head><title>Class A Adventure Jacket</title></head><body>Lightweight adventure jacket.</body></html>`, 'https://rynoxgear.com/products/class-a-jacket', '2026-10-10T00:00:00.000Z');
assert.equal(unverifiedClassProduct.certifications.length, 0, 'does not infer garment certification from an isolated letter');
console.log('Rynox scraper fixture tests passed.');
