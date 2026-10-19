const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-modules.cjs");

test("an unknown ?collection= value never reaches the CRM; a published one does", async () => {
  const detailReads = [];
  const { getCollection } = createLoader({
    "server-only": {},
    "next/cache": { cacheLife() {}, cacheTag() {} },
    "@/features/catalog/catalog-source": {
      loadCatalog: async () => ({ products: [], categories: [] }),
      loadProducts: async () => [],
    },
    "@/features/catalog/crm-api": {
      fetchCollections: async () => [{ slug: "summer", name: "Літо" }],
      fetchCollection: async (slug) => {
        detailReads.push(slug);
        return { slug, name: "Літо", description: null, products: [] };
      },
      fetchBundleDetail: async () => null,
    },
  })("src/features/catalog/queries.ts");

  assert.equal(await getCollection("random-bot-value"), null);
  assert.deepEqual(detailReads, []);
  assert.deepEqual(await getCollection("summer"), {
    slug: "summer",
    title: "Літо",
    description: null,
  });
  assert.deepEqual(detailReads, ["summer"]);
});
