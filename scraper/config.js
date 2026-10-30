// Brand stores to collect from. Confirm each base URL is the brand's current official store.
export const BRANDS = {
  rynox: { name: "Rynox", baseUrl: "https://rynoxgear.com" },
  // DSG (Dream Sporting Gear): confirm the current official store domain, then run with
  //   DSG_BASE_URL=https://<their-store> npm run scrape dsg
  dsg: { name: "DSG", baseUrl: process.env.DSG_BASE_URL ?? null },
};

// Identify yourself so the site owner can contact you. Set SCRAPER_CONTACT to your email.
export const USER_AGENT = `RideBuddyBot/0.1 (+${process.env.SCRAPER_CONTACT ?? "set-SCRAPER_CONTACT"})`;
export const DELAY_MS = 2500; // pause between requests
