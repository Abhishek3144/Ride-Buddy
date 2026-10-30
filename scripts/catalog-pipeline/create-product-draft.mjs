import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProductDraft, parseEmbeddedProduct, slug } from './product-draft.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '../..');
const args = process.argv.slice(2);
const sourceFile = args.find((arg) => !arg.startsWith('--'));
const option = (name) => args[args.indexOf(name) + 1];
const brand = option('--brand');
const domain = option('--domain');
const type = option('--type');
const outputOption = option('--out');

if (!sourceFile || !brand || !domain) {
  console.error('Usage: npm run catalog:manual:draft -- <source-file> --brand "Brand" --domain brand.example [--type gloves] [--out catalog/manual/drafts/product.json]');
  process.exit(1);
}

try {
  const sourceText = await fs.readFile(sourceFile, 'utf8');
  const product = parseEmbeddedProduct(sourceText);
  const draft = createProductDraft(product, { brand, domain, type });
  const outputPath = outputOption
    ? path.resolve(outputOption)
    : path.join(projectRoot, 'catalog', 'manual', 'drafts', `${slug(draft.id)}.json`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(draft, null, 2) + '\n');
  console.log(`Draft created: ${outputPath}`);
  console.log(`Review it, then copy the product object into the correct catalog/manual/<brand>.json products array.`);
} catch (error) {
  console.error(`Draft creation failed: ${error.message}`);
  process.exit(1);
}
