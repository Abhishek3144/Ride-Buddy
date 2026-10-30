// Placeholder sample data. Names and brands are made up; replace with real,
// verified products (and real certificates) before publishing.
const cert = (cls) => ({ standard: "EN 17092", class: cls });
const jacket = (n, ridingStyles, cls, materials) => ({
  id: `j${n}`, name: `Sample Jacket ${n}`, brand: "Sample Brand", type: "jackets",
  ridingStyles, certification: cert(cls), materials, images: [], sources: [],
});

export const jackets = [
  jacket(1, ["touring", "city"], "AAA", ["Cordura", "Aramid lining"]),
  jacket(2, ["touring"], "AAA", ["Leather"]),
  jacket(3, ["offroad", "touring"], "AA", ["Textile", "Mesh panels"]),
  jacket(4, ["touring", "city"], "AA", ["Cordura"]),
  jacket(5, ["offroad"], "AA", ["Textile"]),
  jacket(6, ["city"], "A", ["Polyester", "Mesh panels"]),
  jacket(7, ["city", "touring"], "A", ["Textile"]),
  jacket(8, ["city"], "B", ["Denim", "Aramid blend"]),
  jacket(9, ["offroad", "city"], "C", ["Mesh", "Removable armor"]),
];

