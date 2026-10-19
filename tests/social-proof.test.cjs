const assert = require("node:assert/strict");
const { test, mock, beforeEach, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
for (const name of ["HTMLElement", "Node", "MutationObserver", "Event"])
  globalThis[name] = dom.window[name];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { render, screen, cleanup } = require("@testing-library/react");

class CrmApiError extends Error {
  constructor(status, code = "ERROR") {
    super();
    this.status = status;
    this.code = code;
  }
}
let calls, responses, products, lifetimes, logs;
const mocks = {
  "server-only": {},
  "next/cache": { cacheLife: (profile) => lifetimes.push(profile) },
  "next/link": {
    __esModule: true,
    default: ({ children, href, className }) =>
      React.createElement("a", { href, className }, children),
  },
  "next/image": {
    __esModule: true,
    default: ({ src, alt }) => React.createElement("img", { src, alt }),
  },
  "@/lib/crm-client": {
    CrmApiError,
    crmRequest: async (path) => {
      calls.push(path);
      const answer = responses(path);
      if (answer instanceof Error) throw answer;
      return answer;
    },
  },
  "@/features/catalog/queries": {
    getListedProducts: async () => products,
  },
};
const load = createLoader(mocks);
const server = load("src/features/social-proof/social-proof.server.ts");
const { roundDownCount, reviewExcerpt } = load(
  "src/features/social-proof/display.ts",
);
const { ShopRating, CustomerCount } = load(
  "src/features/social-proof/components/home-social-stats.tsx",
);
const { HomeReviews } = load(
  "src/features/social-proof/components/home-reviews.tsx",
);
const { HomeInstagramShots } = load(
  "src/features/social-proof/components/home-instagram-shots.tsx",
);

// Intl separates digits and units with no-break spaces.
const plain = (text) => text.replace(/\s/gu, " ");
const summary = (modelKey, distribution) => ({
  modelKey,
  average: null,
  count: Object.values(distribution).reduce((sum, value) => sum + value, 0),
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...distribution },
});
const review = (overrides = {}) => ({
  id: "review-1",
  authorName: "Олена",
  body: "Шлейка сіла ідеально.",
  title: null,
  rating: 5,
  verifiedPurchase: true,
  submittedAt: "2026-10-01T10:00:00.000Z",
  reply: null,
  status: "published",
  modelKey: "model-a",
  product: { id: "product-1", name: "Шлейка Curly" },
  ...overrides,
});

beforeEach(() => {
  calls = [];
  lifetimes = [];
  products = [
    { id: "group:model-a", slug: "shleika-curly" },
    { id: "single-b", slug: "bandana" },
  ];
  responses = () => ({ data: [] });
  logs = mock.method(console, "error", () => {});
  delete process.env.SOCIAL_PROOF_CUSTOMERS_MANUAL;
});
afterEach(() => {
  cleanup();
  logs.mock.restore();
  delete process.env.SOCIAL_PROOF_CUSTOMERS_MANUAL;
});

test("shop rating averages exact star counts of every listed model in batches of 100 keys", async () => {
  products = [
    { id: "group:model-a", slug: "a" },
    { id: "group:model-a", slug: "a-red" },
    ...Array.from({ length: 149 }, (_, index) => ({
      id: `product-${index}`,
      slug: `p-${index}`,
    })),
  ];
  responses = (path) => {
    const keys = decodeURIComponent(path.split("modelKeys=")[1]).split(",");
    return {
      data: keys.map((key) =>
        key === "model-a"
          ? summary(key, { 5: 3, 4: 1 })
          : key === "product-0"
            ? summary(key, { 3: 1 })
            : summary(key, {}),
      ),
    };
  };
  const rating = await server.getShopRating();
  assert.deepEqual(rating, { average: (5 * 3 + 4 + 3) / 5, count: 5 });
  assert.equal(calls.length, 2);
  assert.deepEqual(
    calls.map(
      (path) => decodeURIComponent(path.split("modelKeys=")[1]).split(",").length,
    ),
    [100, 50],
  );
  assert.deepEqual(lifetimes, ["hours"]);
});

test("a refused CRM read hides its part, is cached briefly and tells the owner which permission to add", async () => {
  responses = () => new CrmApiError(403, "FORBIDDEN");
  assert.equal(await server.getShopRating(), null);
  assert.deepEqual(lifetimes, ["minutes"]);
  const [message, details] = logs.mock.calls.at(-1).arguments;
  assert.match(message, /shop rating is hidden/);
  assert.equal(details.status, 403);
  assert.match(details.hint, /reviews:read/);
  assert.match(details.hint, /«Змінити права»/);
  lifetimes = [];
  assert.equal(await server.getDeliveredOrderCount(), null);
  assert.match(logs.mock.calls.at(-1).arguments[1].hint, /orders:read/);
  assert.deepEqual(lifetimes, ["minutes"]);
});

test("home reviews and the delivered order count read the agreed CRM queries with their cache lifetimes", async () => {
  responses = (path) =>
    path.startsWith("/reviews")
      ? { data: [review()], pagination: { page: 1, perPage: 8, total: 1 } }
      : { data: [{}], pagination: { page: 1, perPage: 1, total: 312 } };
  assert.equal((await server.getHomeReviews()).length, 1);
  assert.equal(await server.getDeliveredOrderCount(), 312);
  assert.deepEqual(calls, [
    "/reviews?status=published&perPage=8&sort=newest",
    "/orders?status=delivered&perPage=1",
  ]);
  assert.deepEqual(lifetimes, ["hours", "days"]);
  responses = () => new Error("offline");
  assert.equal(await server.getHomeReviews(), null);
});

test("the rating shows only from five reviews, with an accessible star label", async () => {
  responses = () => ({ data: [summary("model-a", { 5: 3, 4: 1 })] });
  assert.equal(await ShopRating({ locale: "uk" }), null);
  responses = () => ({ data: [summary("model-a", { 5: 20, 4: 3 })] });
  render(
    React.createElement("ul", null, await ShopRating({ locale: "uk" })),
  );
  assert.ok(screen.getByRole("img", { name: "Оцінка 4,9 з 5" }));
  assert.match(plain(document.body.textContent), /4,9 з 5· 23 відгуки/);
});

test("the counter takes the larger of the CRM and owner figures, rounded down, and hides below 50", async () => {
  responses = () => ({ data: [], pagination: { total: 40 } });
  assert.equal(await CustomerCount({ locale: "uk" }), null);
  process.env.SOCIAL_PROOF_CUSTOMERS_MANUAL = "1234";
  render(
    React.createElement("ul", null, await CustomerCount({ locale: "uk" })),
  );
  assert.match(plain(document.body.textContent), /^1 200\+задоволених клієнтів$/);
  cleanup();
  process.env.SOCIAL_PROOF_CUSTOMERS_MANUAL = "багато";
  responses = () => new CrmApiError(500);
  assert.equal(await CustomerCount({ locale: "uk" }), null);
  assert.match(
    logs.mock.calls.map((call) => call.arguments[0]).join("\n"),
    /SOCIAL_PROOF_CUSTOMERS_MANUAL must be a whole number/,
  );
  process.env.SOCIAL_PROOF_CUSTOMERS_MANUAL = "60";
  render(
    React.createElement("ul", null, await CustomerCount({ locale: "uk" })),
  );
  assert.match(document.body.textContent, /^60\+/);
});

test("figures round down and long reviews are cut at a word boundary", () => {
  assert.deepEqual(
    [57, 99, 150, 999, 1234, 9999, 12_345].map(roundDownCount),
    [50, 90, 150, 950, 1200, 9900, 12_000],
  );
  const long = `${"Дуже зручна шлейка ".repeat(20)}кінець`;
  const excerpt = reviewExcerpt(long);
  assert.ok(Array.from(excerpt).length <= 201);
  assert.match(excerpt, /шлейка…$|зручна…$|Дуже…$/);
  assert.equal(reviewExcerpt("  Коротко.  "), "Коротко.");
});

test("review cards link to the product by model key, mark verified purchases and pass axe", async () => {
  const longBody = "Дуже ".repeat(60);
  responses = () => ({
    data: [
      review({ body: longBody }),
      review({
        id: "review-2",
        authorName: "Іван",
        verifiedPurchase: false,
        modelKey: "gone-model",
        product: { id: "product-9", name: "Знятий товар" },
      }),
    ],
    pagination: { page: 1, perPage: 8, total: 2 },
  });
  const { container } = render(await HomeReviews({ locale: "uk" }));
  assert.equal(
    screen.getByRole("link", { name: "Шлейка Curly" }).getAttribute("href"),
    "/product/shleika-curly",
  );
  assert.equal(screen.queryByRole("link", { name: "Знятий товар" }), null);
  assert.ok(screen.getByText("Знятий товар"));
  assert.equal(screen.getAllByText("Покупку підтверджено").length, 1);
  assert.match(screen.getByText(/^Дуже/).textContent, /…$/);
  assert.equal(screen.getAllByRole("img", { name: "Оцінка 5 з 5" }).length, 2);
  const axe = require("axe-core");
  const result = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    result.violations.map((violation) => violation.id),
    [],
  );
});

test("no published reviews and no curated screenshots render nothing", async () => {
  responses = () => ({
    data: [],
    pagination: { page: 1, perPage: 8, total: 0 },
  });
  assert.equal(await HomeReviews({ locale: "uk" }), null);
  assert.equal(HomeInstagramShots({ locale: "uk" }), null);
});

test("sample reviews appear only in development while the CRM has none", async (t) => {
  const environment = process.env.NODE_ENV;
  t.after(() => {
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
  });
  responses = () => ({
    data: [],
    pagination: { page: 1, perPage: 8, total: 0 },
  });
  process.env.NODE_ENV = "production";
  assert.equal(await HomeReviews({ locale: "uk" }), null);
  process.env.NODE_ENV = "development";
  render(await HomeReviews({ locale: "uk" }));
  assert.equal(screen.getAllByRole("listitem").length, 8);
  assert.deepEqual(
    [...new Set(screen.getAllByRole("link").map((link) => link.getAttribute("href")))]
      .filter((href) => href.startsWith("/product/"))
      .sort(),
    ["/product/bandana", "/product/shleika-curly"],
  );
});

test("curated screenshots render with their alt text and the follower count", () => {
  const { HomeInstagramShots: Shots } = createLoader({
    ...mocks,
    "@/features/social-proof/config": {
      instagramScreenshots: [
        { src: "/social-proof/1.jpg", alt: "Відгук про шлейку в Direct" },
        { src: "/social-proof/2.jpg", alt: "Сторіс покупчині з пуделем" },
      ],
      instagramFollowers: 12_400,
    },
  })("src/features/social-proof/components/home-instagram-shots.tsx");
  render(Shots({ locale: "uk" }));
  assert.equal(screen.getAllByRole("img").length, 2);
  assert.ok(screen.getByRole("img", { name: "Відгук про шлейку в Direct" }));
  assert.equal(
    plain(screen.getByRole("link").textContent),
    "Ми в Instagram · 12,4 тис. підписників (відкриється в новій вкладці)",
  );
});
