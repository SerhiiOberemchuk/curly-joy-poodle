const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-modules.cjs");

test("recommendations link opens the same CRM catalog source as the displayed products", async () => {
  const newest = [{ id: "newest", inStock: true }];
  let collection = null;
  let curated = [];
  const load = createLoader({
    "server-only": {},
    "@/features/catalog/queries": {
      getCategories: async () => [],
      getCollection: async () => collection,
      getProducts: async (filter) => (filter?.collection ? curated : newest),
    },
  });
  const { getHomeRecommendations } = load("src/features/home/queries.ts");
  assert.deepEqual(await getHomeRecommendations(), {
    products: newest,
    catalogHref: "/catalog",
  });
  collection = { slug: "curly-joy-recommends" };
  assert.deepEqual(await getHomeRecommendations(), {
    products: newest,
    catalogHref: "/catalog",
  });
  curated = [
    { id: "curated", inStock: true },
    { id: "sold-out", inStock: false },
  ];
  assert.deepEqual(await getHomeRecommendations(), {
    products: [curated[0]],
    catalogHref: "/catalog?collection=curly-joy-recommends",
  });
});
