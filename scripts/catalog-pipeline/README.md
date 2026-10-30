# Riding Buddy manual catalog pipeline

This pipeline keeps product research under your control. It does not scrape brand sites, modify the React UI, or replace `src/data/*.js`. Instead, it turns reviewed, manually entered product records into a separate candidate catalog for future integration.

## Daily workflow

1. Copy `catalog/manual/brand-template.json` to `catalog/manual/<brand>.json`.
2. Fill in the brand name, official domain, and products using official product pages as evidence.
3. Run the validation and progress commands.
4. Build only after every record is valid.

```bash
npm run catalog:test-manual
npm run catalog:test-draft
npm run catalog:manual:validate
npm run catalog:manual:progress
npm run catalog:manual:build
npm run catalog:validate
```

The build stops without changing the generated catalog if any manual record is invalid.

## Turn copied page source into a draft

For supported product pages that contain a Shopify-style `var product = {...}` block in their page source, copy the complete block to a local text file. The draft command works only with the text file you supply; it does not visit a website or scrape products.

```powershell
npm run catalog:manual:draft -- "C:\research\ridge-pro-source.txt" --brand "Rynox" --domain rynoxgear.com --type gloves
```

It creates a review draft in `catalog/manual/drafts/`. The command extracts the title, handle, description, price, availability, images, and variants; converts Shopify's paise price to INR; and proposes category, materials, and riding styles. It deliberately leaves certifications empty and marks the product `needs-review`.

Review the generated file, then copy its product object into the `products` array of the appropriate `catalog/manual/<brand>.json` file. You can choose another draft location with `--out <path>`.

To add a copied source block directly to an existing brand database as a `needs-review` record, use:

```powershell
npm run catalog:manual:import-source -- "C:\research\product-source.txt" --catalog catalog/manual/rynox.json --type gloves
```

The import refuses duplicate product IDs and URLs. It does not retrieve any web content; you remain responsible for copying the page source and reviewing the created entry.

## Brand files

Keep one JSON file per brand in `catalog/manual/`. Begin with up to four files, such as `brand-one.json` through `brand-four.json`; the filenames are just labels, so use the actual brand name when you create them. `brand-template.json` is ignored by the pipeline.

Every product requires a stable `id`, product `name`, supported `type`, `productUrl`, `sourceUrl` on the official domain, `lastVerifiedAt` in ISO date format, and a `verificationStatus` of `verified` or `needs-review`. Include factual materials, price, availability, image URLs, and certifications where known.

Use `needs-review` while research is incomplete. Use `verified` only after checking the product page and each entered claim. The template starts with an empty certifications array so a certification is never guessed.

## Outputs

- `catalog/staging/<brand>.validated.json`: normalized records for one brand.
- `catalog/output/catalog.generated.json`: all valid manual records, regenerated on each successful build.
- `catalog/logs/manual-run-*.json`: a build summary.

`catalog:manual:progress` reports products, verified products, entries needing review, and validation problems for each brand file. The generated catalog is deliberately not wired into the React UI yet.

## Adding brands later

Add another brand file, run validation, review its progress, and build again. The pipeline checks duplicate brand/product URLs across all files. Automated sources can be designed later as a separate, explicitly approved extension; this manual pipeline remains the trusted baseline.
