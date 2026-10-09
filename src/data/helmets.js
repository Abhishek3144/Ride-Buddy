// Placeholder sample data. Names and brands are made up; replace with real,
// verified products (and real certificates) before publishing.
// `certification` is the highest-ranked standard the helmet holds; any others go in `otherCertifications`.
const helmet = (n, variant, ridingStyles, standard, others, materials) => ({
  id: `h${n}`, name: `Sample Helmet ${n}`, brand: "Sample Brand", type: "helmets",
  variant, ridingStyles, certification: { standard }, otherCertifications: others,
  materials, images: [], sources: [],
});

export const helmets = [
  helmet(1, "Full-face", ["touring", "city"], "ECE 22.06", ["DOT FMVSS 218", "BIS IS 4151"], ["Carbon fiber shell", "EPS liner"]),
  helmet(2, "Modular", ["touring"], "ECE 22.06", ["BIS IS 4151"], ["Fiberglass composite shell", "EPS liner"]),
  helmet(3, "Full-face", ["touring", "city"], "Snell M2020", ["DOT FMVSS 218"], ["Carbon fiber shell", "EPS liner"]),
  helmet(4, "Offroad", ["offroad"], "DOT FMVSS 218", [], ["Fiberglass composite shell", "EPS liner"]),
  helmet(5, "Full-face", ["city", "touring"], "DOT FMVSS 218", ["BIS IS 4151"], ["Polycarbonate shell", "EPS liner"]),
  helmet(6, "Full-face", ["city"], "BIS IS 4151", [], ["ABS shell", "EPS liner"]),
  helmet(7, "Open-face", ["city"], "BIS IS 4151", [], ["ABS shell", "EPS liner"]),
];
