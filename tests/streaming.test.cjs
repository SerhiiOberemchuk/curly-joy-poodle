const assert = require("node:assert/strict");
const { test } = require("node:test");
const { PassThrough } = require("node:stream");
const React = require("react");
const { renderToPipeableStream } = require("react-dom/server");
const { createLoader } = require("./load-modules.cjs");

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function stream(element, t) {
  const output = new PassThrough();
  const first = deferred();
  const complete = deferred();
  const errors = [];
  let html = "";
  output.on("data", (chunk) => { html += chunk; first.resolve(html); });
  output.on("end", () => complete.resolve(html));
  const rendering = renderToPipeableStream(element, {
    onShellReady() { rendering.pipe(output); },
    onError(error) { errors.push(error); },
  });
  t.after(() => rendering.abort());
  return {
    shell: first.promise,
    complete: complete.promise,
    errors,
    waitForHtml(predicate) {
      if (predicate(html)) return Promise.resolve(html);
      return new Promise((resolve) => {
        function check() {
          if (!predicate(html)) return;
          output.off("data", check);
          resolve(html);
        }
        output.on("data", check);
      });
    },
  };
}

const uiMocks = {
  "server-only": {},
  "next/link": { __esModule: true, default: ({ children, href, ...props }) => React.createElement("a", { href, ...props }, children) },
  "next/server": { connection: async () => {} },
  "@/components/layout/page-transition": { PageTransition: ({ children }) => React.createElement("div", null, children) },
};

test("verified cart lines stream before delayed recommendations", { timeout: 5000 }, async (t) => {
  const suggestions = deferred();
  t.after(() => suggestions.resolve([]));
  let reads = 0;
  const load = createLoader({
    ...uiMocks,
    "@/features/cart/actions": { retryCartAction() {} },
    "@/features/cart/queries": { getCart: async () => ({ isEmpty: false, lines: [{ variantId: "v1", title: "Verified item" }], subtotal: 12500 }) },
    "@/features/checkout/cart-terms.server": { getDisplayCartTerms: async () => null },
    "@/features/catalog/queries": { getProducts: () => { reads++; return suggestions.promise; } },
    "@/features/cart/components/cart-client": {
      CartClient: ({ initialCart, children }) => React.createElement("div", null,
        React.createElement("p", null, initialCart.lines[0].title),
        React.createElement("p", null, initialCart.subtotal), children),
    },
    "@/features/catalog/components/product-shelf": {
      ProductShelfSkeleton: () => React.createElement("p", null, "Suggestions loading"),
      ProductShelf: ({ products }) => React.createElement("p", null, products.map((product) => product.title).join(", ")),
    },
  });
  const { CartView } = load("src/features/cart/components/cart-view.tsx");
  const rendering = stream(await CartView(), t);
  const shell = await rendering.shell;
  assert.match(shell, /Verified item/);
  assert.match(shell, /12500/);
  assert.match(shell, /Suggestions loading/);
  assert.equal(reads, 1);
  suggestions.resolve([{ id: "p2", variantId: "v2", title: "Suggested item", priceFrom: 100, inStock: true }]);
  assert.match(await rendering.complete, /Suggested item/);
  assert.deepEqual(rendering.errors, []);
});

test("order status has one neutral h1 and a card before the receipt resolves", { timeout: 5000 }, async (t) => {
  const receipt = deferred();
  t.after(() => receipt.resolve(null));
  const load = createLoader({
    ...uiMocks,
    "@/features/checkout/actions": {},
    "@/features/checkout/payment/return-receipt": { readPaymentReceipt: () => receipt.promise },
    "@/features/checkout/payment/return-token": {},
    "@/features/checkout/payment/settlement": {},
  });
  const { default: Page } = load("src/app/checkout/success/page.tsx");
  const rendering = stream(Page({ searchParams: Promise.resolve({}) }), t);
  const shell = await rendering.shell;
  assert.match(shell, /<h1 id="receipt-title">Статус замовлення<\/h1>/);
  assert.match(shell, /<section[^>]*aria-labelledby="receipt-title"/);
  assert.match(shell, /Перевіряємо статус замовлення/);
  assert.doesNotMatch(shell, /Оплату підтверджено/);
  receipt.resolve(null);
  const full = await rendering.complete;
  assert.match(full, /Не вдалося відкрити замовлення/);
  assert.equal((full.match(/<h1\b/g) ?? []).length, 1);
  assert.deepEqual(rendering.errors, []);
});

test("review submission becomes ready while the published summary is still pending", { timeout: 5000 }, async (t) => {
  const summary = deferred();
  t.after(() => summary.resolve({ count: 0 }));
  let ratingReads = 0;
  let listReads = 0;
  const product = { id: "p1", slug: "test", title: "Test", type: "product", images: [], variants: [], attributes: [], videos: [] };
  const load = createLoader({
    ...uiMocks,
    "next/navigation": {},
    "next/image": { __esModule: true, default: () => null },
    "@/features/catalog/queries": { getProduct: async () => product, getProductCategory: async () => null },
    "@/features/favorites/favorites": {},
    "@/features/recently-viewed/viewed-products": {},
    "@/features/checkout/cart-terms.server": {},
    "@/features/reviews/catalog-ratings.server": { getReviewCountsForShell: async () => ({ p1: 0 }) },
    "@/features/reviews/crm-reviews": {
      REVIEWS_PER_PAGE: 20,
      modelKeyOf: (id) => id,
      getReviewSummary: () => { ratingReads++; return summary.promise; },
      getPublishedReviews: async () => { listReads++; return { data: [], pagination: { total: 0 } }; },
    },
    "@/features/reviews/components/review-form": {
      ReviewForm: ({ requestId }) => React.createElement("form", { "data-ready": Boolean(requestId) },
        React.createElement("input", { "aria-label": "Ваше ім’я", disabled: !requestId })),
    },
  });
  const { default: Page } = load("src/app/product/[slug]/page.tsx");
  const { ProductReviewsSection } = load("src/features/reviews/components/product-reviews.tsx");
  function findReviews(node) {
    if (!React.isValidElement(node)) return null;
    if (node.type === ProductReviewsSection) return node;
    for (const child of React.Children.toArray(node.props.children)) {
      const found = findReviews(child);
      if (found) return found;
    }
    return null;
  }
  const page = await Page({ params: Promise.resolve({ slug: "test" }), searchParams: Promise.resolve({}) });
  const rendering = stream(findReviews(page), t);
  await rendering.waitForHtml((html) => html.includes('data-ready="true"'));
  assert.ok(ratingReads > 0);
  summary.resolve({ count: 0 });
  assert.match(await rendering.complete, /Поки немає опублікованих відгуків/);
  assert.equal(listReads, 0);
  assert.deepEqual(rendering.errors, []);
});
