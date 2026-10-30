// Deterministic rules shared by the scraper and the image pipeline.
// A rating is recorded only when the text explicitly states it.

// ---- certification: only what the page explicitly states ------------------
const upper = (m) => m && m[1] === m[1].toUpperCase();

function classCert(text, standard, group, classWord) {
  const fwd = new RegExp(`${standard}[^.]{0,80}?${classWord}\\s*${group}\\b`, "i");
  const rev = new RegExp(`${classWord}\\s*${group}\\b[^.]{0,80}?${standard}`, "i");
  const m = [text.match(fwd), text.match(rev)].find((x) => x && upper(x));
  return m ? { m } : null;
}

const HELMET_STANDARDS = [ // highest rank first; mirrors src/data/certifications.js
  ["ECE 22.06", /ECE\s*22[.\-]?06/i],
  ["Snell M2020", /snell[^.]{0,20}M\s*2020/i],
  ["DOT FMVSS 218", /FMVSS\s*218|\bDOT\b[^.]{0,30}(approved|certified|compliant)/i],
  ["BIS IS 4151", /IS\s*4151|\bISI\b|\bBIS\b/i],
];

export function extractCertification(text, type) {
  const clip = (s) => s.slice(0, 160);
  if (type === "jackets" || type === "pants") {
    const r = classCert(text, "EN\\s*17092", "(AAA|AA|A|B|C)", "class");
    return r && { certification: { standard: "EN 17092", class: r.m[1].toUpperCase() }, otherCertifications: [], evidence: clip(r.m[0]) };
  }
  if (type === "gloves" || type === "shoes") {
    const std = type === "gloves" ? "13594" : "13634";
    const r = classCert(text, `EN\\s*${std}`, "([12])", "level");
    return r && { certification: { standard: `EN ${std}`, class: r.m[1], classWord: "level" }, otherCertifications: [], evidence: clip(r.m[0]) };
  }
  if (type === "helmets") {
    const found = HELMET_STANDARDS.map(([name, re]) => [name, text.match(re)]).filter(([, m]) => m);
    if (!found.length) return null;
    return {
      certification: { standard: found[0][0] },
      otherCertifications: found.slice(1).map(([n]) => n),
      evidence: clip(found[0][1][0]),
    };
  }
  return null;
}

// Armour/protector claims (EN 1621) are NOT the garment's rating; keep them separate.
export function protectorNotes(text) {
  const re = /EN\s*1621-[123](?::\d{4})?[^.]{0,40}|CE\s*level\s*[12][^.]{0,30}/gi;
  return [...new Set((text.match(re) ?? []).map((s) => s.trim()))].slice(0, 4);
}

// ---- soft attributes (inferred; always flagged for review) ----------------
const MATERIALS = ["Cordura", "Leather", "Mesh", "Denim", "Polyester", "Nylon", "Aramid", "Kevlar", "Textile", "Neoprene", "Suede", "Gore-Tex"];
export const materialsIn = (t) => MATERIALS.filter((k) => new RegExp(`\\b${k}\\b`, "i").test(t));

export function stylesIn(t) {
  const s = [];
  if (/adventure|off-?road|dual[- ]sport|enduro|\bmx\b|motocross/i.test(t)) s.push("offroad");
  if (/touring|long[- ]distance|highway/i.test(t)) s.push("touring");
  if (/\bcity\b|urban|commut|everyday|daily/i.test(t)) s.push("city");
  return s;
}

export const VARIANTS = [[/gauntlet/i, "Gauntlet"], [/full[- ]face/i, "Full-face"], [/modular|flip[- ]up/i, "Modular"], [/open[- ]face/i, "Open-face"], [/jeans/i, "Riding jeans"], [/sneaker/i, "Riding sneakers"], [/boot/i, "Boots"]];

