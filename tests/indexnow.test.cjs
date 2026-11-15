const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { test } = require("node:test");
const { pathToFileURL } = require("node:url");

const script = import("../scripts/submit-indexnow.mjs");
const origin = "https://curly-joy.com";
const keyFile = new URL("../public/8fe6cf496c114862978765ba251b72f7.txt", pathToFileURL(__filename));
const keyPromise = readFile(keyFile, "utf8").then((value) => value.trim());
const namespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const sitemap = (urls) => `<urlset xmlns="${namespace}">${urls.map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;

async function run({ xml = sitemap([`${origin}/`]), keyStatus = 200, keyBody, sitemapStatus = 200, postStatuses = [200], dryRun = false } = {}) {
  const { submitIndexNow } = await script;
  const key = await keyPromise;
  const requests = [];
  const delays = [];
  let postIndex = 0;
  const result = submitIndexNow({
    siteUrl: origin,
    key,
    dryRun,
    wait: async (delay) => { delays.push(delay); },
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url === `${origin}/${key}.txt`) return new Response(keyBody ?? key, { status: keyStatus });
      if (url === `${origin}/sitemap.xml`) return new Response(xml, { status: sitemapStatus });
      assert.equal(url, "https://www.bing.com/indexnow");
      const status = postStatuses[Math.min(postIndex++, postStatuses.length - 1)];
      return new Response(status === 204 ? null : "", { status });
    },
  });
  return { result, requests, delays, key };
}

test("IndexNow submits only unique page locations, decoding XML and ignoring image locations", async () => {
  const xml = `<urlset xmlns="${namespace}" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url><loc>${origin}/catalog?a=1&amp;b=2</loc><image:image><image:loc>https://cdn.example/photo.jpg</image:loc></image:image></url>
    <url><loc>${origin}/catalog?a=1&amp;b=2</loc></url>
    <url><loc>${origin}/product/жилет</loc></url>
  </urlset>`;
  const { result, requests, key } = await run({ xml });
  assert.deepEqual(await result, { host: "curly-joy.com", urlCount: 2, batches: 1, dryRun: false, statuses: [200] });
  const post = requests.at(-1);
  assert.equal(post.options.method, "POST");
  assert.equal(post.options.headers["Content-Type"], "application/json; charset=utf-8");
  assert.deepEqual(JSON.parse(post.options.body), {
    host: "curly-joy.com",
    key,
    keyLocation: `${origin}/${key}.txt`,
    urlList: [`${origin}/catalog?a=1&b=2`, new URL(`${origin}/product/жилет`).href],
  });
  assert.ok(requests.every(({ options }) => options.redirect === "error" && options.signal instanceof AbortSignal));
});

test("IndexNow dry run verifies the deployed key and sitemap without submitting", async () => {
  const { result, requests } = await run({ dryRun: true });
  assert.deepEqual(await result, { host: "curly-joy.com", urlCount: 1, batches: 1, dryRun: true, statuses: [] });
  assert.equal(requests.length, 2);
  assert.ok(requests.every(({ options }) => options.method !== "POST"));
});

test("IndexNow accepts HTTP 202 as pending key validation", async () => {
  const { result } = await run({ postStatuses: [202] });
  assert.deepEqual((await result).statuses, [202]);
});

test("IndexNow does not submit when the deployed key is missing or incorrect", async () => {
  for (const options of [{ keyStatus: 404 }, { keyBody: "<html>Not a key</html>" }, { keyBody: "another-key" }]) {
    const { result, requests } = await run(options);
    await assert.rejects(result, /deployed IndexNow key must be publicly available/);
    assert.equal(requests.length, 1);
  }
});

test("IndexNow refuses non-HTTPS origins, paths and invalid keys before making requests", async () => {
  const { submitIndexNow } = await script;
  const key = await keyPromise;
  let calls = 0;
  const fetchImpl = async () => { calls++; throw new Error("Unexpected network request"); };
  for (const siteUrl of ["http://curly-joy.com", `${origin}/catalog`, `${origin}/?preview=1`, `${origin}/#test`, "https://user:password@curly-joy.com"]) {
    await assert.rejects(submitIndexNow({ siteUrl, key, fetchImpl }), /canonical HTTPS origin/);
  }
  await assert.rejects(submitIndexNow({ siteUrl: origin, key: "bad key", fetchImpl }), /Invalid IndexNow key/);
  assert.equal(calls, 0);
});

test("IndexNow rejects foreign, preview, insecure and fragment URLs before any submission", async () => {
  for (const invalid of ["https://other.example/page", "https://curly-joy.vercel.app/page", "http://curly-joy.com/page", `${origin}/page#part`, "https://user@curly-joy.com/page", "/relative-page"]) {
    const { result, requests } = await run({ xml: sitemap([`${origin}/`, invalid]) });
    await assert.rejects(result);
    assert.ok(requests.every(({ options }) => options.method !== "POST"));
  }
});

test("IndexNow fails on HTML, malformed, empty and unsupported sitemaps", async () => {
  for (const xml of ["<html><body>Error</body></html>", `<urlset xmlns="${namespace}">`, sitemap([]), `<sitemapindex xmlns="${namespace}"/>`, `<urlset xmlns="${namespace}"><url/></urlset>`, `<urlset xmlns="${namespace}"><url><loc> </loc></url></urlset>`, `<urlset xmlns="${namespace}"><url><loc>${origin}/</loc><loc>${origin}/catalog</loc></url></urlset>`]) {
    const { result, requests } = await run({ xml });
    await assert.rejects(result);
    assert.ok(requests.every(({ options }) => options.method !== "POST"));
  }
});

test("IndexNow fails explicitly when the deployed sitemap is unavailable", async () => {
  const { result, requests } = await run({ sitemapStatus: 404 });
  await assert.rejects(result, /sitemap.xml: HTTP 404/);
  assert.equal(requests.length, 2);
});

test("IndexNow retries server errors and accepts a later successful submission", async () => {
  const { result, requests, delays } = await run({ postStatuses: [503, 502, 200] });
  assert.deepEqual((await result).statuses, [200]);
  assert.equal(requests.filter(({ options }) => options.method === "POST").length, 3);
  assert.deepEqual(delays, [1000, 2000]);
});

test("IndexNow reports rate limits and permanent rejections without immediate retries", async () => {
  for (const status of [400, 403, 422, 429, 204, 503]) {
    const { result, requests } = await run({ postStatuses: [status] });
    await assert.rejects(result, new RegExp(`Bing IndexNow rejected batch 1: HTTP ${status}`));
    assert.equal(requests.filter(({ options }) => options.method === "POST").length, status === 503 ? 3 : 1);
  }
});

test("IndexNow bounds network retries and never submits after a preflight connection failure", async () => {
  const { submitIndexNow } = await script;
  const delays = [];
  let attempts = 0;
  await assert.rejects(submitIndexNow({
    siteUrl: origin,
    key: await keyPromise,
    fetchImpl: async () => { attempts++; throw new Error("connection reset"); },
    wait: async (delay) => { delays.push(delay); },
  }), (error) => {
    assert.match(error.message, /Request to .*\.txt failed/);
    assert.equal(error.cause.message, "connection reset");
    return true;
  });
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [1000, 2000]);
});

test("IndexNow splits sitemap URLs at the protocol's 10,000 URL limit", async () => {
  const urls = Array.from({ length: 10_001 }, (_, index) => `${origin}/product/item-${index}`);
  const { result, requests } = await run({ xml: sitemap(urls) });
  assert.equal((await result).batches, 2);
  const batches = requests.filter(({ options }) => options.method === "POST").map(({ options }) => JSON.parse(options.body).urlList);
  assert.equal(batches[0].length, 10_000);
  assert.deepEqual(batches[1], [urls.at(-1)]);
});
