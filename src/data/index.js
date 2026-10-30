import catalogGenerated from '../../catalog/output/catalog.generated.json';
// 1. Add strict .js extensions and use wildcard imports to safely catch both 'default' or named exports
import * as glovesMod from './gloves.js';
import * as helmetsMod from './helmets.js';
import * as jacketsMod from './jackets.js';
import * as pantsMod from './pants.js';
import * as shoesMod from './shoes.js';

// Helper to extract the array regardless of how the legacy files exported it
const extractArray = (mod) => mod.default || Object.values(mod).find(Array.isArray) || [];

// Safely parse the catalog whether it exported an object { products: [] } or a raw array
const rawCatalog = Array.isArray(catalogGenerated) 
  ? catalogGenerated 
  : (catalogGenerated?.products || []);

// 2. Normalize the data: The UI expects a singular string 'certification', but catalog uses an array
const catalogProducts = rawCatalog.map(item => ({
  ...item,
  certification: item.certification || (item.certifications && item.certifications[0]) || 'unrated'
}));

const getMergedList = (type, sampleMod) => {
  const verifiedProducts = catalogProducts.filter(p => p.type === type);
  const sampleList = extractArray(sampleMod);
  return verifiedProducts.length > 0 ? verifiedProducts : sampleList;
};

export const GEAR_DATA = {
  gloves: getMergedList('gloves', glovesMod),
  helmets: getMergedList('helmets', helmetsMod),
  jackets: getMergedList('jackets', jacketsMod),
  pants: getMergedList('pants', pantsMod),
  shoes: getMergedList('shoes', shoesMod),
};