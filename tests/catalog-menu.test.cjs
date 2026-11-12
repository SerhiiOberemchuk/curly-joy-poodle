const assert = require("node:assert/strict");
const test = require("node:test");
const { createLoader } = require("./load-modules.cjs");

const categories = [
  { id: "c1", slug: "aksesuary", title: "Аксесуари", parentId: null, imageUrl: null },
  { id: "c2", slug: "parfumy", title: "Парфуми", parentId: null, imageUrl: null },
  { id: "c3", slug: "povidky", title: "Повідки", parentId: "c1", imageUrl: null },
];

function loadMenu({ products = [], collections = {}, failure = null } = {}) {
  const fail = async () => {
    throw failure;
  };
  return createLoader({
    "server-only": {},
    "@/lib/crm-errors": { crmFailureDetails: () => ({}) },
    "@/features/catalog/queries": {
      getCategories: failure ? fail : async () => categories,
      getCategoryTiles: async (parentId) =>
        categories
          .filter((category) => category.parentId === parentId)
          .map((category) => ({ ...category, coverUrl: `https://cdn/${category.slug}.jpg` })),
      getProducts: async () => products,
      getCollectionSlugs: async () => Object.keys(collections),
      getCollection: async (slug) => collections[slug] ?? null,
    },
  })("src/features/catalog/menu.server.ts");
}

test("the catalog menu lists top categories with covers and their subcategories", async () => {
  const { getCatalogMenu } = loadMenu();
  const menu = await getCatalogMenu();
  assert.deepEqual(menu.categories, [
    {
      slug: "aksesuary",
      title: "Аксесуари",
      coverUrl: "https://cdn/aksesuary.jpg",
      children: [{ slug: "povidky", title: "Повідки" }],
    },
    { slug: "parfumy", title: "Парфуми", coverUrl: "https://cdn/parfumy.jpg", children: [] },
  ]);
  assert.deepEqual(menu.collections, []);
  assert.equal(menu.hasSale, false);
});

test("the menu offers sale only with an old price above the current one, and live collections only", async () => {
  const { getCatalogMenu } = loadMenu({
    products: [
      { priceFrom: 50000, compareAtPrice: 50000 },
      { priceFrom: 40000, compareAtPrice: 50000 },
    ],
    collections: { summer: { slug: "summer", title: "Літо", description: null }, hidden: null },
  });
  const menu = await getCatalogMenu();
  assert.equal(menu.hasSale, true);
  assert.deepEqual(menu.collections, [{ slug: "summer", title: "Літо" }]);

  const { getCatalogMenu: withoutSale } = loadMenu({
    products: [{ priceFrom: 50000, compareAtPrice: 50000 }],
  });
  assert.equal((await withoutSale()).hasSale, false);
});

test("a failed CRM read leaves the header without a menu instead of breaking the page", async (t) => {
  const logged = t.mock.method(console, "error", () => {});
  const { getCatalogMenu } = loadMenu({ failure: new Error("CRM down") });
  assert.equal(await getCatalogMenu(), null);
  assert.equal(logged.mock.callCount(), 1);
});
