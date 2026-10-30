import assert from 'node:assert/strict';
import { createProductDraft, parseEmbeddedProduct } from './product-draft.mjs';

const source = 'var product = {"id":6917780570179,"title":"RIDGE PRO OFFROAD GLOVES","handle":"ridge-pro-offroad-gloves","description":"<p>Perforated full-grain leather and 3D mesh for off-road riding.</p>","price":235000,"available":false,"media":[{"src":"//rynoxgear.com/cdn/shop/files/ridge.jpg"}],"variants":[{"public_title":"S / Black","sku":"RIDGE-S-BLK","available":false,"price":235000}]};';
const product = parseEmbeddedProduct(source);
const draft = createProductDraft(product, { brand: 'Rynox', domain: 'rynoxgear.com', verifiedAt: '2026-10-24T00:00:00.000Z' });
assert.equal(draft.id, 'rynox-ridge-pro-offroad-gloves');
assert.equal(draft.type, 'gloves');
assert.equal(draft.price, 2350);
assert.equal(draft.availability, 'unavailable');
assert.deepEqual(draft.images, ['https://rynoxgear.com/cdn/shop/files/ridge.jpg']);
assert.deepEqual(draft.certifications, []);
assert.equal(draft.verificationStatus, 'needs-review');
console.log('Product-source draft tests passed.');
