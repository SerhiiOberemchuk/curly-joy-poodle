const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-modules.cjs");

const load = createLoader({});
const { productJsonLd, serializeJsonLd, storeJsonLd } = load(
  "src/features/catalog/structured-data.ts",
);
const { openGraph, shareImage } = load("src/lib/metadata.ts");

function product(overrides = {}) {
  return {
    slug: "shleika-curly-myw-1",
    title: "Шлейка Curly",
    summary: "М’яка шлейка",
    brand: "GF Pet",
    images: [{ src: "https://example.com/1.jpg", alt: "Шлейка" }],
    variants: [{ sku: "MYW-1", price: 120000, inStock: true }],
    ...overrides,
  };
}

test("a product with a photo gets Product and BreadcrumbList data with its price", () => {
  const [item, crumbs] = productJsonLd(product(), { title: "Амуніція", slug: "amunitsiia" });
  assert.equal(item["@type"], "Product");
  assert.deepEqual(item.image, ["https://example.com/1.jpg"]);
  assert.equal(item.offers.price, "1200.00");
  assert.equal(item.offers.availability, "https://schema.org/InStock");
  assert.equal(crumbs["@type"], "BreadcrumbList");
  assert.equal(crumbs.itemListElement.at(-1).item, "https://curly-joy.com/product/shleika-curly-myw-1");
});

test("a product without a photo keeps only the breadcrumbs, never an empty image list", () => {
  const data = productJsonLd(product({ images: [{ src: null, alt: "" }] }), null);
  assert.deepEqual(data.map((entry) => entry["@type"]), ["BreadcrumbList"]);
  assert.doesNotMatch(serializeJsonLd(data), /"image"/);
});

test("JSON-LD cannot close its script element", () => {
  assert.doesNotMatch(
    serializeJsonLd(productJsonLd(product({ title: "</script><b>" }), null)),
    /<\/script>/,
  );
});

test("every page's share card keeps the site name, locale and an image", () => {
  const page = openGraph({ title: "Каталог", url: "/catalog" });
  assert.equal(page.siteName, "Curly Joy Store");
  assert.equal(page.locale, "uk_UA");
  assert.deepEqual(page.images, [shareImage]);
  assert.equal(shareImage.width, 1200);
  assert.equal(shareImage.height, 630);
  const own = openGraph({ title: "Шлейка", images: [{ url: "https://example.com/1.jpg" }] });
  assert.deepEqual(own.images, [{ url: "https://example.com/1.jpg" }]);
  assert.equal(own.siteName, "Curly Joy Store");
});

test("published reviews add an aggregate rating; none adds no rating", () => {
  const [rated] = productJsonLd(product(), null, { average: 4.666, count: 3 });
  assert.deepEqual(rated.aggregateRating, {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    reviewCount: 3,
    bestRating: 5,
    worstRating: 1,
  });
  const [plain] = productJsonLd(product(), null, null);
  assert.equal("aggregateRating" in plain, false);
});

test("the home page describes the shop with its real contacts and profiles", () => {
  const [store, website] = storeJsonLd();
  assert.equal(store["@type"], "OnlineStore");
  assert.equal(store.name, "Curly Joy");
  assert.equal(store.logo, "https://curly-joy.com/images/brand/logo-brand-clean.png");
  assert.ok(store.sameAs.includes("https://www.instagram.com/curly_joy_poodle"));
  assert.equal(website["@type"], "WebSite");
});

test("category and collection pages always describe themselves, from the CRM or a fallback", async () => {
  const notFound = () => {
    throw new Error("not found");
  };
  const mocks = {
    "server-only": {},
    "next/navigation": { notFound },
    "@/features/catalog/components/catalog-page": { CatalogPage: () => null },
  };
  const category = createLoader({
    ...mocks,
    "@/features/catalog/queries": {
      getCategory: async (slug) => ({ slug, title: "Аксесуари", description: null }),
      getCategorySlugs: async () => ["aksesuary"],
    },
  })("src/app/catalog/[category]/page.tsx");
  const meta = await category.generateMetadata({ params: Promise.resolve({ category: "aksesuary" }) });
  assert.equal(meta.description, "Усі товари категорії «Аксесуари» в одному місці.");
  assert.equal(meta.alternates.canonical, "/catalog/aksesuary");
  assert.equal(meta.openGraph.siteName, "Curly Joy Store");

  const collection = createLoader({
    ...mocks,
    "@/features/catalog/queries": {
      getCollection: async (slug) => (slug === "summer" ? { slug, title: "Літо", description: "Легкі речі" } : null),
      getCollectionSlugs: async () => ["summer"],
    },
  })("src/app/collection/[collection]/page.tsx");
  const summer = await collection.generateMetadata({ params: Promise.resolve({ collection: "summer" }) });
  assert.equal(summer.description, "Легкі речі");
  assert.equal(summer.alternates.canonical, "/collection/summer");
  await assert.rejects(
    collection.generateMetadata({ params: Promise.resolve({ collection: "nope" }) }),
    /not found/,
  );
});
