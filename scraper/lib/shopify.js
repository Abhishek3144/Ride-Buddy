import { politeGet } from "./http.js";

// Shopify stores publish their catalogue at /products.json (250 per page).
export async function fetchShopifyProducts(baseUrl, robots) {
  const all = [];
  for (let page = 1; page < 50; page++) {
    const res = await politeGet(`${baseUrl}/products.json?limit=250&page=${page}`, robots);
    const { products } = await res.json();
    if (!products?.length) break;
    all.push(...products);
    if (products.length < 250) break;
  }
  return all;
}
