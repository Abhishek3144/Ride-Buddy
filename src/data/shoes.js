// Placeholder sample data. Names and brands are made up; replace with real,
// verified products (and real certificates) before publishing.
const shoe = (n, variant, ridingStyles, level, materials) => ({
  id: `s${n}`, name: `Sample Boots ${n}`, brand: "Sample Brand", type: "shoes",
  variant, ridingStyles,
  certification: { standard: "EN 13634", class: level, classWord: "level" },
  materials, images: [], sources: [],
});

export const shoes = [
  shoe(1, "Touring boots", ["touring", "city"], "2", ["Leather", "Ankle protectors"]),
  shoe(2, "Touring boots", ["touring"], "2", ["Leather", "Waterproof membrane"]),
  shoe(3, "Offroad boots", ["offroad"], "2", ["Leather", "Plastic shin plates"]),
  shoe(4, "Riding shoes", ["city", "touring"], "1", ["Leather", "Ankle protectors"]),
  shoe(5, "Riding sneakers", ["city"], "1", ["Synthetic leather", "Reinforced toe"]),
  shoe(6, "Riding sneakers", ["city"], "1", ["Suede", "Ankle cup"]),
  shoe(7, "Offroad boots", ["offroad", "touring"], "1", ["Synthetic leather", "Buckle closure"]),
];
