import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { JSDOM } from "jsdom";

const KEY_FILE = new URL("../public/8fe6cf496c114862978765ba251b72f7.txt", import.meta.url);
const ENDPOINT = "https://www.bing.com/indexnow";
const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
const BATCH_SIZE = 10_000;

/** Read only the page locations in the storefront's single XML sitemap. */
export function parseSitemap(xml, origin) {
  const dom = new JSDOM(xml, { contentType: "application/xml" });
  try {
    const root = dom.window.document.documentElement;
    if (root.localName !== "urlset" || root.namespaceURI !== SITEMAP_NAMESPACE) {
      throw new Error("Expected a sitemap urlset, not HTML or a sitemap index.");
    }

    const urls = new Set();
    for (const entry of root.children) {
      if (entry.localName !== "url" || entry.namespaceURI !== SITEMAP_NAMESPACE) continue;
      const locations = [...entry.children].filter(
        (child) => child.localName === "loc" && child.namespaceURI === SITEMAP_NAMESPACE,
      );
      if (locations.length !== 1 || !locations[0].textContent.trim()) {
        throw new Error("Each sitemap page must have exactly one nonempty loc.");
      }
      const url = new URL(locations[0].textContent.trim());
      if (url.origin !== origin || url.username || url.password || url.hash) {
        throw new Error(`Sitemap URL must belong to ${origin} without credentials or fragments: ${url.href}`);
      }
      urls.add(url.href);
    }
    if (!urls.size) throw new Error("The sitemap contains no page URLs; nothing was submitted.");
    return [...urls];
  } finally {
    dom.window.close();
  }
}

/** Retry network failures and server errors; leave rate limits for a later run. */
async function request(url, options, fetchImpl, wait) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetchImpl(url, {
        ...options,
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      if (attempt === 2) throw new Error(`Request to ${url} failed.`, { cause: error });
    }
    if (response && (response.status < 500 || attempt === 2)) return response;
    await response?.body?.cancel();
    await wait(1_000 * 2 ** attempt);
  }
}

export async function submitIndexNow({
  siteUrl,
  key,
  dryRun = false,
  fetchImpl = fetch,
  wait = setTimeout,
}) {
  const site = new URL(siteUrl);
  if (site.protocol !== "https:" || site.pathname !== "/" || site.search || site.hash || site.username || site.password) {
    throw new Error("--site must be the canonical HTTPS origin, without a path, query or credentials.");
  }
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error("Invalid IndexNow key.");

  const keyLocation = new URL(`/${key}.txt`, site.origin).href;
  const keyResponse = await request(keyLocation, {}, fetchImpl, wait);
  if (keyResponse.status !== 200 || (await keyResponse.text()).trim() !== key) {
    throw new Error(`The deployed IndexNow key must be publicly available at ${keyLocation} (HTTP ${keyResponse.status}).`);
  }

  const sitemapUrl = new URL("/sitemap.xml", site.origin).href;
  const sitemapResponse = await request(sitemapUrl, {}, fetchImpl, wait);
  if (sitemapResponse.status !== 200) {
    throw new Error(`Unable to read ${sitemapUrl}: HTTP ${sitemapResponse.status}.`);
  }
  const urls = parseSitemap(await sitemapResponse.text(), site.origin);
  const statuses = [];
  if (!dryRun) {
    for (let start = 0; start < urls.length; start += BATCH_SIZE) {
      const response = await request(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: site.host,
          key,
          keyLocation,
          urlList: urls.slice(start, start + BATCH_SIZE),
        }),
      }, fetchImpl, wait);
      if (response.status !== 200 && response.status !== 202) {
        throw new Error(`Bing IndexNow rejected batch ${statuses.length + 1}: HTTP ${response.status}. Check the key, sitemap and rate limits before rerunning.`);
      }
      statuses.push(response.status);
      await response.body?.cancel();
    }
  }
  return { host: site.host, urlCount: urls.length, batches: Math.ceil(urls.length / BATCH_SIZE), dryRun, statuses };
}

async function main() {
  const { values } = parseArgs({
    options: {
      site: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });
  if (!values.site) throw new Error("Specify the production origin with --site=https://curly-joy.com.");
  const result = await submitIndexNow({
    siteUrl: values.site,
    key: (await readFile(KEY_FILE, "utf8")).trim(),
    dryRun: values["dry-run"],
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.statuses.includes(202)) console.log("Bing received the URLs; IndexNow key validation is pending.");
  if (!result.dryRun) console.log("URL submission does not guarantee crawling or indexing.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]))) {
  main().catch((error) => {
    console.error(error.message);
    if (error.cause) console.error(error.cause.message);
    process.exitCode = 1;
  });
}
