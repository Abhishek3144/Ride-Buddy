import { certKey } from "../data/certifications.js";

// Groups items by certification class (or standard), highest-ranked first.
export function groupByRating(items, rankMap) {
  const groups = {};
  for (const item of items) {
    (groups[certKey(item.certification)] ||= []).push(item);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => (rankMap[b]?.rank ?? 0) - (rankMap[a]?.rank ?? 0))
    .map(([key, list]) => ({ key, items: list }));
}
