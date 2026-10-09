// Placeholder sample data. Names and brands are made up; replace with real,
// verified products (and real certificates) before publishing.
const glove = (n, variant, ridingStyles, level, materials) => ({
  id: `g${n}`, name: `Sample Gloves ${n}`, brand: "Sample Brand", type: "gloves",
  variant, ridingStyles,
  certification: { standard: "EN 13594", class: level, classWord: "level" },
  materials, images: [], sources: [],
});

export const gloves = [
  glove(1, "Gauntlet", ["touring", "city"], "2", ["Leather", "Knuckle protector"]),
  glove(2, "Gauntlet", ["touring"], "2", ["Leather", "Aramid lining"]),
  glove(3, "Short cuff", ["city", "touring"], "2", ["Leather", "Carbon knuckle"]),
  glove(4, "Short cuff", ["city"], "1", ["Textile", "Leather palm"]),
  glove(5, "Gauntlet", ["touring", "offroad"], "1", ["Textile", "Knuckle protector"]),
  glove(6, "Offroad", ["offroad"], "1", ["Synthetic leather", "Mesh back"]),
  glove(7, "Short cuff", ["city"], "1", ["Leather"]),
  glove(8, "Offroad", ["offroad", "city"], "1", ["Mesh", "Silicone grip"]),
];
