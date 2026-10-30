import { loadManualCatalogs, validateManualCatalogs } from './manual-catalog.mjs';

const { catalogs, errors: loadErrors } = await loadManualCatalogs();
const { products, errors: validationErrors } = validateManualCatalogs(catalogs);
const errors = [...loadErrors, ...validationErrors];
for (const issue of errors) {
  const location = issue.index == null ? issue.file : `${issue.file} product ${issue.index + 1}${issue.name ? ` (${issue.name})` : ''}`;
  console.error(`\n${location}\n- ${issue.errors.join('\n- ')}`);
}
console.log(`Manual catalog validation: ${catalogs.length} brand file(s), ${products.length} valid product(s), ${errors.length} issue(s).`);
if (errors.length) process.exitCode = 1;
