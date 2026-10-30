import robotsParser from "robots-parser";
import { USER_AGENT, DELAY_MS } from "../config.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getRobots(baseUrl) {
  const url = `${baseUrl}/robots.txt`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  // No robots.txt means no stated restrictions; any other failure means stop.
  if (res.status === 404) return robotsParser(url, "");
  if (!res.ok) throw new Error(`Could not read ${url} (HTTP ${res.status}). Not scraping without it.`);
  return robotsParser(url, await res.text());
}

export async function politeGet(url, robots) {
  if (robots.isAllowed(url, USER_AGENT) === false) {
    throw new Error(`robots.txt disallows ${url} for this bot. Stopping.`);
  }
  await sleep(DELAY_MS);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json,text/html" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}
