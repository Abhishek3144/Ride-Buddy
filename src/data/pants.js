// Placeholder sample data. Names and brands are made up; replace with real,
// verified products (and real certificates) before publishing.
const pant = (n, variant, ridingStyles, cls, materials) => ({
  id: `p${n}`, name: `Sample Pants ${n}`, brand: "Sample Brand", type: "pants",
  variant, ridingStyles, certification: { standard: "EN 17092", class: cls },
  materials, images: [], sources: [],
});

export const pants = [
  pant(1, "Leather pants", ["touring", "city"], "AAA", ["Leather", "Aramid lining"]),
  pant(2, "Textile pants", ["touring"], "AAA", ["Cordura", "Removable armor"]),
  pant(3, "Textile pants", ["touring", "offroad"], "AA", ["Textile", "Mesh panels"]),
  pant(4, "Riding jeans", ["city", "touring"], "AA", ["Denim", "Aramid lining"]),
  pant(5, "Riding jeans", ["city"], "A", ["Denim", "Aramid blend"]),
  pant(6, "Offroad pants", ["offroad"], "A", ["Textile", "Knee armor"]),
  pant(7, "Overpants", ["city"], "B", ["Polyester", "Removable armor"]),
  pant(8, "Riding jeans", ["city"], "C", ["Denim", "Knee armor"]),
];
