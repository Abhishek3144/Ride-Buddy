# Image to database pipeline

Turns screenshots of brand product pages into `output/gear.csv` and `output/gear.sql`.

## 1. Capture
One folder per product, one or more screenshots inside:
```
inbox/rynox/outlander-pro-jacket/1.png   (title, price)
inbox/rynox/outlander-pro-jacket/2.png   (features, materials)
inbox/rynox/outlander-pro-jacket/3.png   (certification / specifications)
```
- Capture in viewport-sized pieces. One very tall full-page screenshot gets downscaled and the text turns unreadable.
- Always include the section that names the certification, if the page has one.
- Up to 8 images per product. PNG, JPG or WebP.

## 2. Extract (needs a Gemini API key)
Create a key in Google AI Studio, then in PowerShell:
```powershell
cd pipeline
$env:GEMINI_API_KEY = "your-key"
npm run extract rynox
```
No `npm install` is needed; the pipeline has no dependencies. Each product gets one model call that transcribes the visible text into `staging/rynox/<product>.json`. Products already extracted are skipped (add `-- --force` to redo).

- Model: `gemini-2.5-flash` by default. Set `GEMINI_MODEL` if Google has renamed or replaced it.
- The free tier has low request limits, so the script waits 5 s between products (`EXTRACT_DELAY_MS`) and retries after a rate-limit error.
- On the free tier Google may use the content you send to improve its products. Public product-page screenshots are fine; don't send anything private.
- A model can misread small text, so spot-check the `certification_evidence` column in the CSV against the screenshot for every rated product.

## 3. Review and correct
Open a staging file. Fix anything by adding it under `overrides`, for example:
```json
"overrides": { "certification": { "standard": "EN 17092", "class": "AA" }, "ridingStyles": ["touring"] }
```
An override clears that field's review flag.

## 4. Export
```powershell
npm run export
```
Writes `output/gear.csv` (opens in Excel) and `output/gear.sql` (`sqlite3 gear.db < output/gear.sql`). The summary shows how many products have a stated rating and which fields still need review.

## Rules
- The rating is computed from the transcribed text by the same rules as the scraper (`../shared/rules.js`). The model never decides it. If the page doesn't state a class, the rating stays empty.
- "CE Level 2 protectors" describe the armour, not the garment, and are kept in `protectors`.
- Staging files hold transcribed brand text, so they are not committed. Screenshots in `inbox/` are not committed either.
