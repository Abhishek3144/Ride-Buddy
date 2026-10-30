import assert from 'node:assert/strict';
import { validateManualCatalogs } from './manual-catalog.mjs';

const validCatalog = {
  file: 'example-brand.json',
  brand: 'Example Brand',
  officialDomain: 'www.example.com',
  products: [{
    id: 'example-brand-tour-jacket',
    name: 'Tour Jacket',
    type: 'jackets',
    productUrl: 'https://www.example.com/products/tour-jacket',
    sourceUrl: 'https://www.example.com/products/tour-jacket',
    lastVerifiedAt: '2026-10-23T00:00:00.000Z',
    verificationStatus: 'verified',
    images: [],
    certifications: []
  }]
};

const valid = validateManualCatalogs([validCatalog]);
assert.equal(valid.errors.length, 0, 'accepts a valid official-source product');
assert.equal(valid.products.length, 1, 'normalizes valid products');

const invalid = validateManualCatalogs([{ ...validCatalog, products: [{ ...validCatalog.products[0], sourceUrl: 'https://unofficial.example/products/tour-jacket', verificationStatus: 'unknown' }] }]);
assert.ok(invalid.errors[0].errors.includes('sourceUrl must be an HTTP(S) URL on the configured officialDomain'));
assert.ok(invalid.errors[0].errors.includes('verificationStatus must be verified or needs-review'));
console.log('Manual catalog pipeline tests passed.');
