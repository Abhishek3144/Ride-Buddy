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
