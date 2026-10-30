# Brand data collector

Collects public product listings from brand stores and normalizes them to the Riding Buddy record shape.
Output is for **review**, not for loading straight into the database.

## Before you run it
1. Read the brand's terms of use and `robots.txt`. The script refuses to fetch anything robots.txt disallows, but terms of use are your call. If in doubt, ask the brand for permission or a product feed.
2. Set `SCRAPER_CONTACT` to your email so the bot's user agent identifies you.
3. Confirm each store URL in `config.js`. DSG's is not set; pass it with `DSG_BASE_URL`.

## Run
```bash
cd scraper && npm install
SCRAPER_CONTACT=you@example.com npm run scrape rynox
SCRAPER_CONTACT=you@example.com DSG_BASE_URL=https://<dsg-store> npm run scrape dsg
npm test
```
Requests are spaced 2.5 s apart. Output goes to `output/<brand>.normalized.json` (raw responses in `output/raw/`).

## Rules the parser follows
- A rating is recorded **only if the page states it**: EN 17092 class (jackets, pants), EN 13594 level (gloves), EN 13634 level (boots), or a helmet standard. Otherwise `certification` is `null`.
- "CE Level 2 protectors" (EN 1621) describe the armour, not the garment. They go in `protectors` and never become the rating.
- `ridingStyles` and `materials` are inferred from keywords. Anything empty is listed in `needsReview`.
- `images` stays empty; image URLs are kept in `imageUrls` until image usage is cleared.
- Accessories (bags, covers, rain layers) are skipped. Armor items are kept as type `armor` for the later version.
- Works for Shopify stores (`/products.json`). Other platforms need an HTML adapter.
