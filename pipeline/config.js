// Check Google's current model names (AI Studio / Gemini API docs) and override with GEMINI_MODEL if needed.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const DELAY_MS = Number(process.env.EXTRACT_DELAY_MS ?? 5000); // pause between products (free-tier rate limits)
export const BRAND_NAMES = { rynox: "Rynox", dsg: "DSG" };
export const IMAGE_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
export const MAX_IMAGES = 8; // per product
