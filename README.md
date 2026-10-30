# Riding Buddy

A guide that helps riders in India choose riding gear by certification, material and riding style.

## Run locally

```bash
npm install
npm run dev
```

## Structure

- `src/data/` gear datasets (placeholder samples), certification rank maps and gear categories
- `src/components/` nav drawer, gear row and card
- `src/pages/` home, listing and detail pages
- `src/utils/groupByRating.js` groups gear by certification, highest rank first

## Adding a gear type

1. Add `src/data/<type>.js` and register it in `src/data/index.js`
2. Add a rank map in `src/data/certifications.js` and register it in `CERT_MAPS`
3. Set `ready: true` for it in `src/data/gearTypes.js`

## Status

v1: jackets, helmets, gloves, pants and shoes (flow: home → gear picker → listing → detail) with sample data. Purchase sources are a placeholder block.

## Manual brand catalog pipeline

The React UI remains unchanged and continues to read `src/data/*.js`. A separate manual, source-backed catalog pipeline is available for carefully adding product data from a small number of brands.

```bash
npm run catalog:manual:validate
npm run catalog:manual:progress
npm run catalog:manual:build
```

Create one file per brand in `catalog/manual/` from `brand-template.json`. The pipeline validates source links, duplication, product fields, certification format, and review status before it generates the candidate catalog. See `scripts/catalog-pipeline/README.md` for the entry format and workflow.

For a product page whose source contains a Shopify-style `var product = {...}` block, first copy that block to a text file, then create a local review draft:

```bash
npm run catalog:manual:draft -- "C:\research\product-source.txt" --brand "Brand" --domain brand.example --type gloves
```

The helper never accesses the website. It only converts the source text you supplied into a `needs-review` draft in `catalog/manual/drafts/`.
