const assert = require("node:assert/strict");
const { test, afterEach, mock } = require("node:test");
const { createLoader } = require("./load-modules.cjs");

let products = [];
let summaries = new Map();
let batches = [];
let unavailable = false;
const empty = (modelKey) => ({ modelKey, average: null, count: 0, distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } });
const load = createLoader({
  "server-only": {},
  "next/cache": { cacheLife: () => {} },
  "@/features/catalog/queries": { getListedProducts: async () => products },
  "@/lib/crm-client": {
    CrmApiError: class extends Error {},
    crmRequest: async (url) => {
      if (unavailable) throw new Error("read denied");
      const keys = new URL(url, "https://crm.invalid").searchParams.get("modelKeys").split(",");
      batches.push(keys);
      return { data: keys.map((key) => summaries.get(key) ?? empty(key)) };
    },
  },
  "@/lib/crm-errors": { crmFailureDetails: () => ({ message: "unavailable" }) },
});
const { getCatalogReviewSummaries } = load("src/features/reviews/catalog-ratings.server.ts");
const { getCardRatingsAction } = load("src/features/reviews/card-ratings.actions.ts");
afterEach(() => { mock.restoreAll(); unavailable = false; });

test("catalog ratings deduplicate model keys and respect the CRM batch limit", async () => {
  products = [...Array.from({ length: 205 }, (_, i) => ({ id: `p${i}` })), { id: "group:p0" }];
  batches = [];
  const result = await getCatalogReviewSummaries();
  assert.deepEqual(batches.map((batch) => batch.length), [100, 100, 5]);
  assert.equal(result.length, 205);
  assert.equal(batches.flat().includes("group:p0"), false);
});

test("cards get exact published averages and counts, grouped IDs and no invented zero rating", async () => {
  products = [{ id: "group:group-a" }, { id: "single" }, { id: "unreviewed" }];
  summaries = new Map([
    ["group-a", { ...empty("group-a"), average: 4.3, count: 3, distribution: { "1": 0, "2": 0, "3": 0, "4": 2, "5": 1 } }],
    ["single", { ...empty("single"), average: 5, count: 1, distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 } }],
  ]);
  assert.deepEqual(await getCardRatingsAction(), {
    ok: true,
    ratings: { "group:group-a": { average: 13 / 3, count: 3 }, single: { average: 5, count: 1 } },
  });
});

test("a review service outage yields an unavailable result rather than fake ratings", async () => {
  unavailable = true;
  mock.method(console, "error", () => {});
  assert.deepEqual(await getCardRatingsAction(), { ok: false });
});
