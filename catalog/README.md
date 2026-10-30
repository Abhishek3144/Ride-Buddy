# Catalog pipeline workspace

`manual/` holds one editable, source-backed JSON file per brand. `staging/` holds normalized per-brand records, `output/` holds the combined candidate catalog, and `logs/` holds manual build summaries. Generate these files with `npm run catalog:manual:build`; review them before use. The current React app continues to use `src/data/*.js`.
