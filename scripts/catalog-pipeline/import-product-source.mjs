import fs from 'node:fs/promises';
import path from 'node:path';
import { createProductDraft, parseEmbeddedProduct } from './product-draft.mjs';

const args = process.argv.slice(2);
const sourceFile = args.find((arg) => !arg.startsWith('--'));
const option = (name) => args[args.indexOf(name) + 1];
const catalogFile = option('--catalog');
const type = option('--type');

if (!sourceFile || !catalogFile) {
  console.error('Usage: npm run catalog:manual:import-source -- <source-file> --catalog catalog/manual/rynox.json [--type gloves]');
  process.exit(1);
}

try {
  const [sourceText, catalogText] = await Promise.all([fs.readFile(sourceFile, 'utf8'), fs.readFile(catalogFile, 'utf8')]);
  const catalog = JSON.parse(catalogText);
  
  if (!String(catalog.brand ?? '').trim() || !String(catalog.officialDomain ?? '').trim() || !Array.isArray(catalog.products)) {
    throw new Error('Catalog file must contain brand, officialDomain, and a products array.');
  }

  let draft;

  try {
    // 1. Try the original method (looking for var product = {...})
    const product = parseEmbeddedProduct(sourceText);
    draft = createProductDraft(product, { brand: catalog.brand, domain: catalog.officialDomain, type });
  } catch (originalError) {
    // 2. Fallback: If original fails, check if the source file contains an HTML <img> tag
    if (sourceText.includes('<img')) {
      const srcMatch = sourceText.match(/data_max_resolution="([^"]+)"/) || sourceText.match(/src="([^"]+)"/);
      const altMatch = sourceText.match(/alt="([^"]+)"/);

      if (!srcMatch) {
        throw new Error('Found an HTML image tag but could not extract the URL.');
      }

      // Clean up the URL
      let imageUrl = srcMatch[1].replace(/&amp;/g, '&');
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }

      // Clean up Name and generate a basic ID/Slug
      const altText = altMatch ? altMatch[1] : 'Unknown Product';
      const cleanName = altText.replace(/^color_/i, '').trim();
      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 40);

      // Construct a manual draft object
      draft = {
        id: `${catalog.brand.toLowerCase().replace(/\s+/g, '-')}-${slug}`,
        name: cleanName,
        type: type || 'unknown',
        variant: 'Common',
        description: 'Imported from HTML snippet. Please review.',
        materials: [],
        ridingStyles: [],
        certifications: [],
        images: [imageUrl],
        price: 0,
        currency: catalog.brand.toLowerCase() === 'alpinestars' ? 'USD' : 'INR',
        availability: 'in-stock',
        productUrl: `https://${catalog.officialDomain}/products/${slug}`,
        sourceUrl: `https://${catalog.officialDomain}/products/${slug}`,
        lastVerifiedAt: new Date().toISOString(),
        verificationStatus: 'needs-review'
      };
    } else {
      // If it doesn't have an img tag, throw the original error
      throw originalError;
    }
  }

  // Check for duplicates
  if (catalog.products.some((item) => item.id === draft.id || item.images.includes(draft.images[0]))) {
    throw new Error(`This product is already in ${catalogFile}: ${draft.name}`);
  }

  // Save to catalog
  catalog.products.push(draft);
  await fs.writeFile(path.resolve(catalogFile), JSON.stringify(catalog, null, 2) + '\n');
  
  console.log(`Added "${draft.name}" as needs-review to ${catalogFile}.`);
  console.log('Run npm run catalog:manual:validate and review the new record before building the catalog.');

} catch (error) {
  console.error(`Source import failed: ${error.message}`);
  process.exit(1);
}