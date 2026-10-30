// Rank decides row order (highest first). One map per gear type, keyed by
// class (jackets) or by standard name (helmets, which have no classes).
// NOTE: rankings and descriptions are a first proposal. Check them against the
// published standards before launch.
export const JACKET_CLASSES = {
  AAA: { rank: 5, summary: "Highest abrasion and impact protection in EN 17092. Built for fast road riding." },
  AA: { rank: 4, summary: "High protection for general road and touring use." },
  A: { rank: 3, summary: "Moderate protection, suited to lower-speed riding such as city commutes." },
  B: { rank: 2, summary: "Abrasion protection only, with lighter requirements and no impact protection tested." },
  C: { rank: 1, summary: "Impact protectors only on key zones, with limited abrasion protection." },
};

export const HELMET_STANDARDS = {
  "ECE 22.06": { rank: 4, summary: "Current UN regulation for helmets. Adds rotational-motion tests, more impact speeds and points, and visor checks. Approved through independent lab testing." },
  "Snell M2020": { rank: 4, summary: "Voluntary standard with strict impact and penetration testing. Snell samples and tests helmets itself." },
  "DOT FMVSS 218": { rank: 3, summary: "US standard that manufacturers self-certify, checked through government spot testing." },
  "BIS IS 4151": { rank: 2, summary: "Indian standard, mandatory for helmets sold in India (look for the ISI mark). Sets the minimum safety baseline." },
};

export const GLOVE_LEVELS = {
  "2": { rank: 2, summary: "The higher level in EN 13594, with stricter abrasion, tear, cut and impact requirements. Better for road and touring use." },
  "1": { rank: 1, summary: "The lower level in EN 13594, with lighter performance thresholds. Suited to short, low-speed rides." },
};

export const SHOE_LEVELS = {
  "2": { rank: 2, summary: "The higher level in EN 13634, with stricter abrasion, impact and cut-through requirements. Better for road and touring use." },
  "1": { rank: 1, summary: "The lower level in EN 13634, with lighter performance thresholds. Suited to short, low-speed rides." },
};

// Pants use the same EN 17092 classes as jackets.
export const CERT_MAPS = { jackets: JACKET_CLASSES, helmets: HELMET_STANDARDS, gloves: GLOVE_LEVELS, pants: JACKET_CLASSES, shoes: SHOE_LEVELS };

// Key used to group and rank an item: its class if it has one, else its standard.
export const certKey = (c) => c.class ?? c.standard;
export const certLabel = (c) => (c.class ? `${c.standard} ${c.classWord ?? "class"} ${c.class}` : c.standard);
