const assert = require("node:assert/strict");
const { test, beforeEach } = require("node:test");
const { createLoader } = require("./load-modules.cjs");
let calls, cart, quote, failure, refreshes;
class CrmApiError extends Error {
  constructor(status, reason, details) {
    super();
    this.status = status;
    this.reason = reason;
    this.details = details;
  }
}
const load = createLoader({
  "server-only": {},
  "next/cache": { refresh: () => { refreshes++; } },
  "@/features/cart/cart-cookie": {
    readCartCookie: async () => [{ p: "p1", q: 2 }],
  },
  "@/features/cart/queries": { loadCart: async () => ({ cart }) },
  "@/lib/visitor": {
    visitorHeaders: async () => ({ "x-obriym-visitor": "hash" }),
  },
  "@/lib/crm-client": {
    CrmApiError,
    crmRequest: async (path, body, headers) => {
      calls.push({ path, body, headers });
      if (failure) throw failure;
      return { data: quote };
    },
  },
});
const { quotePromotionAction } = load(
  "src/features/checkout/promotions.actions.ts",
);
const { promotionCartKey } = load("src/features/checkout/promotions.ts");
beforeEach(() => {
  calls = [];
  failure = null;
  refreshes = 0;
  cart = {
    subtotal: 10000,
    isEmpty: false,
    lines: [
      {
        variantId: "p1",
        sku: "SKU-1",
        title: "Товар",
        option: null,
        quantity: 2,
        unitPrice: 5000,
      },
    ],
  };
  quote = {
    currency: "UAH",
    code: "WELCOME",
    discountAmount: "5.00",
    totalAmount: "95.00",
    lineDiscountAmounts: ["5.00"],
    reservesUse: false,
    shippingDecision: {
      state: "not_free",
      threshold: "100.00",
      evaluatedAmount: "95.00",
      currency: "UAH",
    },
  };
});
function input(overrides = {}) {
  return {
    code: " welcome ",
    email: "Maria@Example.com",
    delivery: "np-branch",
    cartKey: promotionCartKey(cart.lines),
    ...overrides,
  };
}
test("quote uses fresh CRM cart prices and returns net shipping without reserving a code", async () => {
  const result = await quotePromotionAction(
    input({ items: [{ unitPrice: "0.01" }] }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.quote.totalAmount, "95.00");
  assert.equal(result.quote.shippingDecision.state, "not_free");
  assert.deepEqual(calls[0], {
    path: "/promotions/quote",
    body: {
      currency: "UAH",
      customer: { email: "maria@example.com" },
      items: [
        { productName: "Товар", sku: "SKU-1", quantity: 2, unitPrice: "50.00" },
      ],
      delivery: { carrier: "nova_poshta", method: "branch" },
      promotion: { code: "WELCOME" },
    },
    headers: { "x-obriym-visitor": "hash" },
  });
});
test("quote refuses bad input and changed cart before asking CRM", async () => {
  assert.equal((await quotePromotionAction(input({ email: "bad" }))).ok, false);
  assert.equal(refreshes, 0);
  const changed = await quotePromotionAction(input({ cartKey: "old" }));
  assert.equal(changed.ok, false);
  assert.doesNotMatch(changed.message, /Оновіть сторінку/);
  assert.equal(changed.cartKey, promotionCartKey(cart.lines));
  assert.equal(refreshes, 1);
  assert.equal(calls.length, 0);
});
test("quote rejects inconsistent totals, allocations and currency", async () => {
  for (const patch of [
    { totalAmount: "94.00" },
    { lineDiscountAmounts: [] },
    { lineDiscountAmounts: ["4.00"] },
    { currency: "USD" },
    { code: "OTHER" },
  ]) {
    const original = quote;
    quote = { ...quote, ...patch };
    assert.equal((await quotePromotionAction(input())).ok, false);
    quote = original;
  }
});
test("quote maps every public CRM refusal to buyer copy and treats outages separately", async () => {
  const cases = [
    ["price_changed", /Сума зі знижкою змінилася/],
    ["email_mismatch", /лише з email, на який його надіслано/],
    ["not_eligible", /не підходить для цього замовлення/],
    ["usage_limit_reached", /Ліміт використання/],
    ["code_unavailable", /недоступний/],
    ["no_eligible_items", /акційні товари не беруть участі/],
    ["currency_mismatch", /валюти/],
  ];
  for (const [reason, pattern] of cases) {
    failure = new CrmApiError(409, reason);
    assert.match((await quotePromotionAction(input())).message, pattern);
  }
  failure = new CrmApiError(409, "minimum_not_met", {
    minimumAmount: "500.00",
    currency: "UAH",
  });
  assert.match((await quotePromotionAction(input())).message, /500 ₴/);
  failure = new CrmApiError(409, "minimum_not_met");
  assert.match((await quotePromotionAction(input())).message, /недостатня/);
  failure = new CrmApiError(429);
  assert.match((await quotePromotionAction(input())).message, /Забагато/);
  failure = new CrmApiError(403);
  assert.match(
    (await quotePromotionAction(input())).message,
    /тимчасово недоступна/,
  );
});
