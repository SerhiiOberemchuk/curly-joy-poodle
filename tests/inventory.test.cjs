const assert = require("node:assert/strict");
const { test, beforeEach } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

// Run the real TS modules with only framework IO, the CRM transport and order
// persistence replaced. No network requests, CRM writes or payments in tests.
const cookieValues = new Map();
let formToken;
let products, requests, savedOrders, refreshes, failApi, cacheReads;
let cacheProfiles, cachedTags;
let capabilities, crmOrders, link, failOrder, failPayment, invalidAddress;
const CITY_REF = "8d5a980d-391c-11dd-90d9-001a92567626";
const BRANCH_REF = "1ec09d88-e1c2-11e3-8c4a-0050568002cf";
const STREET_REF = "1ec09d88-e1c2-11e3-8c4a-0050568002cd";
const mocks = {
  "server-only": {},
  "next/cache": {
    refresh: () => {
      refreshes++;
    },
    cacheLife: (profile) => {
      cacheReads++;
      cacheProfiles.push(profile);
    },
    cacheTag: (...tags) => {
      cachedTags.push(...tags);
    },
  },
  "next/headers": {
    cookies: async () => ({
      get: (name) =>
        cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
      set: (name, value) => cookieValues.set(name, value),
      delete: (name) => cookieValues.delete(name),
    }),
  },
  "next/navigation": {
    redirect: (url) => {
      throw new Error(`redirect:${url}`);
    },
  },
  "next/server": { connection: async () => {} },
  "next/link": {
    __esModule: true,
    default: ({ children }) => React.createElement("a", null, children),
  },
  "@/components/ui/button": {
    buttonStyles: () => "button",
    Button: ({ children, type, disabled, className }) =>
      React.createElement("button", { type, disabled, className }, children),
  },
  "@/components/ui/price": {
    Price: () => React.createElement("span", null, "price"),
  },
};

const load = createLoader(mocks);

function product(overrides = {}) {
  return {
    id: "p1",
    sku: "SKU-1",
    name: "Product",
    type: "simple",
    currency: "UAH",
    price: 420,
    stock: 25,
    availability: "in_stock",
    status: "active",
    storefrontVisible: true,
    compareAtPrice: null,
    prices: [],
    productGroupId: null,
    size: null,
    color: null,
    description: null,
    descriptionHtml: null,
    attributes: [],
    brand: null,
    category: null,
    images: [],
    ...overrides,
  };
}
function setCart(lines) {
  cookieValues.set("cjp_cart_v2", JSON.stringify(lines));
}
function form(quantity, variantId = "p1") {
  const data = new FormData();
  data.set("variantId", variantId);
  data.set("quantity", String(quantity));
  return data;
}
async function renderProduct() {
  const { getRecentProduct } = load("src/features/catalog/queries.ts");
  const current = await getRecentProduct("sku-1");
  const { AddToCartForm } = load(
    "src/features/cart/components/add-to-cart-form.tsx",
  );
  return renderToStaticMarkup(
    React.createElement(AddToCartForm, {
      optionName: current.optionName,
      variants: current.variants,
    }),
  );
}

beforeEach(async () => {
  products = [product()];
  requests = [];
  savedOrders = [];
  refreshes = 0;
  cacheReads = 0;
  cacheProfiles = [];
  cachedTags = [];
  failApi = false;
  cookieValues.clear();
  capabilities = {
    cart: {
      currency: "UAH",
      byCurrency: [],
      freeShippingThreshold: null,
      minOrderAmount: null,
    },
    payments: [
      { key: "monobank", status: "active", paymentLink: true },
      { key: "cod", status: "active" },
    ],
    shipping: [
      { key: "nova_poshta", status: "active", modes: ["warehouse", "doors"] },
    ],
  };
  crmOrders = new Map();
  link = null;
  failOrder = false;
  failPayment = false;
  invalidAddress = false;
  process.env.OBRIYM_CRM_API_KEY =
    "test-token-with-at-least-thirty-two-characters";
  process.env.OBRIYM_CRM_API_URL = "https://crm.test/api/v1";
  process.env.SITE_URL = "http://localhost:3001";
  formToken = await load(
    "src/features/checkout/checkout-attempt.ts",
  ).createCheckoutToken();
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (failApi) throw new Error("CRM unavailable");
    const path = new URL(url).pathname;
    const payload = options.body ? JSON.parse(options.body) : null;
    if (path.endsWith("/capabilities"))
      return Response.json({ data: capabilities });
    if (path.endsWith("/categories")) return Response.json({ data: [] });
    if (path.endsWith("/cities"))
      return Response.json({
        data: invalidAddress
          ? []
          : [{ ref: CITY_REF, settlementRef: CITY_REF, label: "Kyiv" }],
      });
    if (path.endsWith("/warehouses")) {
      const data = invalidAddress
        ? []
        : [{ ref: BRANCH_REF, label: "Branch 1", number: "1" }];
      return Response.json({
        data,
        pagination: { page: 1, perPage: 100, total: data.length },
      });
    }
    if (path.endsWith("/streets"))
      return Response.json({ data: [{ ref: STREET_REF, label: "Street" }] });
    if (path.endsWith("/payment-link")) {
      if (payload && failPayment)
        return Response.json(
          { error: { code: "SERVER_ERROR" } },
          { status: 502 },
        );
      if (payload) {
        link = {
          checkoutUrl: "https://pay.mono.test/invoice",
          paymentId: "payment-1",
          provider: "monobank",
          returnUrl: payload.returnUrl ?? null,
          expiresAt: null,
        };
        // Like the CRM: an issued invoice is recorded as a pending payment.
        const order = crmOrders.get(decodeURIComponent(path.split("/").at(-2)));
        if (order && !order.payments.some((p) => p.id === link.paymentId))
          order.payments.push({
            id: link.paymentId,
            status: "pending",
            amount: order.totalAmount,
            currency: "UAH",
            refundedAmount: null,
            createdAt: new Date().toISOString(),
          });
      }
      return link
        ? Response.json({ data: link })
        : Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }
    if (path.endsWith("/orders") && payload) {
      if (failOrder)
        return Response.json(
          { error: { code: "SERVER_ERROR" } },
          { status: 500 },
        );
      if (payload.promotion && !crmOrders.has(payload.externalId)) {
        const expected = (
          payload.items.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.quantity,
            0,
          ) * 0.95
        ).toFixed(2);
        if (payload.promotion.expectedTotal !== expected)
          return Response.json(
            { error: { code: "CONFLICT", reason: "price_changed" } },
            { status: 409 },
          );
      }
      if (!crmOrders.has(payload.externalId)) {
        savedOrders.push(payload);
        crmOrders.set(payload.externalId, {
          id: "crm-1",
          externalId: payload.externalId,
          number: "101",
          status: "pending",
          currency: "UAH",
          totalAmount:
            payload.promotion?.expectedTotal ??
            payload.items
              .reduce(
                (total, item) => total + Number(item.unitPrice) * item.quantity,
                0,
              )
              .toFixed(2),
          payments: [],
          shipments: [],
        });
      }
      return Response.json({ data: { id: "crm-1", number: "101" } });
    }
    if (path.includes("/orders/"))
      return Response.json({
        data: crmOrders.get(decodeURIComponent(path.split("/").at(-1))),
      });
    return Response.json({
      data: products,
      pagination: { page: 1, perPage: 100, total: products.length },
    });
  };
});

test("sold-out product shows quantity zero and disables both quantity buttons", async () => {
  products = [product({ stock: 0, availability: "out_of_stock" })];
  const html = await renderProduct();
  assert.match(html, /name="quantity" value="0"/);
  assert.match(html, /aria-label="Зменшити кількість" disabled=""/);
  assert.match(html, /aria-label="Збільшити кількість" disabled=""/);
  assert.match(html, /disabled=""[^>]*>Немає в наявності/);
  assert.doesNotMatch(html, /У наявності:/);
});

test("real stock is displayed; the last unit cannot be incremented", async () => {
  products = [product({ stock: 1 })];
  const html = await renderProduct();
  assert.match(html, /У наявності: 1 шт\./);
  assert.match(html, /aria-label="Збільшити кількість" disabled=""/);
});

test("unknown stock does not invent a number or disable an available product", async () => {
  products = [product({ stock: null })];
  const html = await renderProduct();
  assert.match(html, /У наявності/);
  assert.doesNotMatch(
    html,
    /У наявності:|Максимум|aria-label="Збільшити кількість" disabled/,
  );
});

test("fresh stock reads bypass the persistent catalog cache", async () => {
  const { findVariant } = load("src/features/catalog/queries.ts");
  assert.equal((await findVariant("p1")).variant.stock, 25);
  products[0].stock = 0;
  assert.equal((await findVariant("p1")).variant.inStock, false);
  assert.equal(cacheReads, 0);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(({ options }) => options.cache === "no-store"));
});

test("adding and reading more than ten units respects the real CRM stock", async () => {
  const { addToCartAction } = load("src/features/cart/actions.ts");
  const { readCartCookie } = load("src/features/cart/cart-cookie.ts");
  const { getCart } = load("src/features/cart/queries.ts");
  assert.equal((await addToCartAction({}, form(25))).status, "success");
  assert.deepEqual(await readCartCookie(), [{ p: "p1", q: 25 }]);
  assert.equal((await getCart()).lines[0].quantity, 25);
  assert.equal((await getCart()).lines[0].maxQuantity, 25);
});

test("cumulative additions cannot exceed stock or silently change the request", async () => {
  setCart([{ p: "p1", q: 20 }]);
  const { addToCartAction } = load("src/features/cart/actions.ts");
  assert.equal((await addToCartAction({}, form(6))).status, "error");
  assert.equal(JSON.parse(cookieValues.get("cjp_cart_v2"))[0].q, 20);
  assert.equal((await addToCartAction({}, form(5))).status, "success");
});

test("cart quantity changes update totals locally and stay within displayed stock", async (t) => {
  // The browser cookie must accept each change, or the store undoes it.
  const { window } = new JSDOM("", { url: "http://localhost/cart" });
  Object.assign(globalThis, { window, document: window.document, location: window.location });
  t.after(() => {
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.location;
  });
  const { loadCart } = load("src/features/cart/queries.ts");
  const { createCartStore } = load("src/features/cart/cart-store.tsx");
  capabilities.cart.freeShippingThreshold = 1000;
  const cart = (await loadCart([{ p: "p1", q: 2 }])).cart;
  const store = createCartStore();
  store.getState().hydrate(cart);
  const crmReads = requests.length;
  store.getState().setQuantity("p1", 3);
  assert.equal(store.getState().cart.lines[0].quantity, 3);
  assert.equal(store.getState().cart.subtotal, cart.lines[0].unitPrice * 3);
  assert.equal(store.getState().cart.freeShipping, true);
  assert.equal(store.getState().cart.freeShippingRemainder, 0);
  store.getState().setQuantity("p1", 26);
  assert.equal(store.getState().cart.lines[0].quantity, 3);
  store.getState().hydrate(cart);
  assert.equal(store.getState().cart.lines[0].quantity, 2);
  store.getState().setQuantity("p1", 4);
  assert.equal(store.getState().cart.itemCount, 4);
  store.getState().remove("p1");
  assert.equal(store.getState().cart.isEmpty, true);
  assert.equal(store.getState().error, null);
  assert.equal(requests.length, crmReads);
});

test("cart reads current prices and all lines from one CRM snapshot", async () => {
  products = [
    product({ price: 500 }),
    product({ id: "p2", sku: "SKU-2", stock: 2 }),
  ];
  const { loadCart } = load("src/features/cart/queries.ts");
  const buildCart = async (stored) => (await loadCart(stored)).cart;
  const cart = await buildCart([
    { p: "p1", q: 12 },
    { p: "p2", q: 3 },
  ]);
  assert.equal(cart.lines[0].unitPrice, 50000);
  assert.equal(cart.lines[1].quantity, 2);
  assert.equal(
    requests.filter(({ url }) => new URL(url).pathname.endsWith("/products"))
      .length,
    1,
  );
});

test("checkout stops before saving an order if stock has decreased", async () => {
  setCart([{ p: "p1", q: 5 }]);
  products[0].stock = 2;
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const result = await placeOrderAction({}, new FormData());
  assert.equal(result.status, "error");
  assert.match(result.message, /Наявність товарів змінилася/);
  assert.equal(savedOrders.length, 0);
  assert.equal(JSON.parse(cookieValues.get("cjp_cart_v2"))[0].q, 2);
});

test("checkout does not silently submit only the surviving cart items", async () => {
  setCart([
    { p: "p1", q: 2 },
    { p: "p2", q: 1 },
  ]);
  products = [product({ stock: 0 }), product({ id: "p2", sku: "SKU-2" })];
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  assert.equal((await placeOrderAction({}, new FormData())).status, "error");
  assert.equal(savedOrders.length, 0);
  assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart_v2")), [
    { p: "p2", q: 1 },
  ]);
});

test("CRM failure prevents additions and checkout without changing the cart", async () => {
  setCart([{ p: "p1", q: 12 }]);
  failApi = true;
  const { addToCartAction } = load("src/features/cart/actions.ts");
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  assert.equal((await addToCartAction({}, form(1))).status, "error");
  assert.equal((await placeOrderAction({}, new FormData())).status, "error");
  assert.equal(savedOrders.length, 0);
  assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart_v2")), [
    { p: "p1", q: 12 },
  ]);
});

test("invalid and fractional CRM stocks never create zero-quantity order lines", async () => {
  const { loadCart } = load("src/features/cart/queries.ts");
  const buildCart = async (stored) => (await loadCart(stored)).cart;
  for (const stock of [undefined, "5"]) {
    products = [product({ stock })];
    await assert.rejects(buildCart([{ p: "p1", q: 1 }]));
  }
  for (const stock of [-1, 0.5]) {
    products = [product({ stock })];
    assert.equal((await buildCart([{ p: "p1", q: 1 }])).isEmpty, true);
  }
  products = [product({ stock: 2.8 })];
  assert.equal((await buildCart([{ p: "p1", q: 3 }])).lines[0].quantity, 2);
});

test("untracked inventory does not impose an arbitrary quantity limit", async () => {
  products = [product({ stock: null })];
  const { addToCartAction } = load("src/features/cart/actions.ts");
  const { getCart } = load("src/features/cart/queries.ts");
  assert.equal((await addToCartAction({}, form(50))).status, "success");
  const cart = await getCart();
  assert.equal(cart.lines[0].quantity, 50);
  assert.equal(cart.lines[0].maxQuantity, null);
});

test("checkout with sufficient current stock saves the full quantity above ten", async () => {
  setCart([{ p: "p1", q: 20 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const data = new FormData();
  data.set("expectedSubtotal", "840000");
  data.set("checkoutToken", formToken);
  for (const [key, value] of Object.entries({
    firstName: "Test",
    lastName: "Customer",
    phone: "+380670000000",
    email: "customer@example.test",
    city: "Kyiv",
    cityRef: CITY_REF,
    citySearch: "Kyiv",
    destination: "1",
    branchRef: BRANCH_REF,
    branchSearch: "",
    streetRef: "",
    streetSearch: "",
    building: "",
    flat: "",
    delivery: "np-branch",
    payment: "cod",
  }))
    data.set(key, value);
  await assert.rejects(
    placeOrderAction({}, data),
    /redirect:\/checkout\/success/,
  );
  assert.equal(savedOrders.length, 1);
  assert.equal(savedOrders[0].items[0].quantity, 20);
  assert.equal(savedOrders[0].items[0].unitPrice, "420.00");
  assert.equal(
    savedOrders[0].items[0].quantity *
      Number(savedOrders[0].items[0].unitPrice),
    8400,
  );
});

test("duplicate cookie lines cannot bypass the per-product stock check", async () => {
  products[0].stock = 3;
  setCart([
    { p: "p1", q: 2 },
    { p: "p1", q: 2 },
  ]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  assert.equal((await placeOrderAction({}, new FormData())).status, "error");
  assert.equal(savedOrders.length, 0);
  assert.equal(refreshes, 1);
  assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart_v2")), [
    { p: "p1", q: 3 },
  ]);
});

function checkoutData(overrides = {}) {
  const stored = JSON.parse(cookieValues.get("cjp_cart_v2") ?? "[]");
  const quotedTotal = stored.reduce(
    (sum, line) =>
      sum +
      Math.round((products.find((p) => p.id === line.p)?.price ?? 0) * 100) *
        line.q,
    0,
  );
  const values = {
    expectedSubtotal: String(quotedTotal),
    checkoutToken: formToken,
    firstName: "Test",
    lastName: "Customer",
    phone: "+380670000000",
    email: "customer@example.test",
    city: "Forged city",
    cityRef: CITY_REF,
    citySearch: "Kyiv",
    destination: "Forged branch",
    branchRef: BRANCH_REF,
    branchSearch: "",
    streetRef: "",
    streetSearch: "",
    building: "",
    flat: "",
    delivery: "np-branch",
    payment: "card",
    comment: "",
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("managed promotion keeps original CRM prices, pays the net total and replays the accepted first order without another quote", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const data = checkoutData({
    promotionCode: "welcome",
    promotionTotal: "39900",
    promotionCartKey: JSON.stringify([["p1", 1, 42000]]),
  });
  await assert.rejects(
    placeOrderAction({}, data),
    /redirect:https:\/\/pay.mono.test/,
  );
  assert.deepEqual(savedOrders[0].promotion, {
    code: "WELCOME",
    expectedTotal: "399.00",
  });
  assert.equal(savedOrders[0].items[0].unitPrice, "420.00");
  assert.equal(savedOrders[0].promoCode, undefined);
  assert.equal(savedOrders[0].discountAmount, undefined);
  assert.equal(savedOrders[0].shippingThresholdAmount, undefined);
  assert.equal([...crmOrders.values()][0].totalAmount, "399.00");
  await assert.rejects(
    placeOrderAction({}, data),
    /redirect:https:\/\/pay.mono.test/,
  );
  assert.equal(savedOrders.length, 1);
  assert.equal(
    requests.some(({ url }) => url.includes("/promotions/quote")),
    false,
  );
});

test("managed promotion rejects a stale cart and missing expectation locally, then surfaces CRM price conflicts before payment", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  assert.equal(
    (await placeOrderAction({}, checkoutData({ promotionCode: "WELCOME" })))
      .status,
    "error",
  );
  assert.equal(savedOrders.length, 0);
  const state = await placeOrderAction(
    {},
    checkoutData({
      promotionCode: "WELCOME",
      promotionTotal: "1",
      promotionCartKey: JSON.stringify([["p1", 1, 42000]]),
    }),
  );
  assert.match(state.message, /Сума зі знижкою змінилася/);
  assert.equal(savedOrders.length, 0);
  assert.equal(
    requests.some(({ url }) => url.endsWith("/payment-link")),
    false,
  );
});

test("checkout uses carrier labels and refs validated on the server", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(
    placeOrderAction({}, checkoutData()),
    /redirect:https:\/\/pay.mono.test/,
  );
  assert.equal(savedOrders[0].customer.shippingAddress.city, "Kyiv");
  assert.equal(savedOrders[0].delivery.branch, "Branch 1");
  assert.equal(savedOrders[0].delivery.branchRef, BRANCH_REF);
  assert.equal(savedOrders[0].delivery.cod, false);
  assert.equal(JSON.parse(cookieValues.get("cjp_cart_v2"))[0].q, 1);
});

test("checkout starts with contacts and an old buyer cookie cannot force login or attach an account", async () => {
  setCart([{ p: "p1", q: 1 }]);
  cookieValues.set("cjp_buyer", "a-session-left-by-the-removed-profile-flow");
  const { default: CheckoutPage } = load("src/app/checkout/page.tsx");
  const content = CheckoutPage().props.children[1].props.children;
  const html = renderToStaticMarkup(await content.type(content.props));
  assert.match(html, /Контактні дані/);
  assert.doesNotMatch(html, /Ваш профіль покупця|Email для входу|Отримати код/);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(
    placeOrderAction({}, checkoutData({ buyerReference: "forged-account" })),
    /redirect:https:/,
  );
  assert.equal(savedOrders[0].customer.externalId, undefined);
  assert.equal(
    requests.some(({ url }) => new URL(url).pathname.includes("/customers")),
    false,
  );
});

test("retrying the same checkout reuses both the CRM order and its active payment link", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  assert.equal(savedOrders.length, 1);
  assert.equal(
    requests.filter(
      (request) =>
        request.url.endsWith("/payment-link") &&
        request.options.method === "POST",
    ).length,
    1,
  );
});

test("HTTPS checkout sends the shop confirmation URL to CRM and reuses a matching payment link", async () => {
  process.env.SITE_URL = "https://curly-joy.com/";
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  const creates = requests.filter(
    (r) => r.url.endsWith("/payment-link") && r.options.method === "POST",
  );
  assert.equal(creates.length, 1);
  const payload = JSON.parse(creates[0].options.body);
  assert.equal(payload.provider, "monobank");
  const returned = new URL(payload.returnUrl);
  assert.equal(
    returned.origin + returned.pathname,
    "https://curly-joy.com/checkout/success",
  );
  assert.equal(
    await load(
      "src/features/checkout/payment/return-token.ts",
    ).readPaymentReturnToken(returned.searchParams.get("token")),
    savedOrders[0].externalId,
  );
  assert.ok(payload.returnUrl.length < 2048);
});

test("HTTP localhost does not send a return URL that CRM would reject", async () => {
  const { getOrCreatePaymentLink } = load("src/features/checkout/crm/index.ts");
  await getOrCreatePaymentLink("order-1");
  const create = requests.find((r) => r.options.method === "POST");
  assert.deepEqual(JSON.parse(create.options.body), { provider: "monobank" });
});

test("a CRM return page on an existing link is replaced when the shop switches to HTTPS", async () => {
  const { getOrCreatePaymentLink } = load("src/features/checkout/crm/index.ts");
  await getOrCreatePaymentLink("order-1");
  assert.equal(link.returnUrl, null);
  process.env.SITE_URL = "https://curly-joy.com";
  await getOrCreatePaymentLink("order-1");
  const creates = requests.filter((r) => r.options.method === "POST");
  assert.equal(creates.length, 2);
  assert.equal(
    new URL(link.returnUrl).origin + new URL(link.returnUrl).pathname,
    "https://curly-joy.com/checkout/success",
  );
});

test("the confirmation receipt shows the CRM number and actual payment state instead of a stale local status", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  const { readReceiptCookie } = load("src/features/checkout/receipt-cookie.ts");
  const { currentReceipt } = load(
    "src/features/checkout/payment/settlement.ts",
  );
  const receipt = await readReceiptCookie();
  const pending = await currentReceipt({ ...receipt, status: "paid" });
  assert.equal(pending.receipt.status, "pending");
  assert.equal(pending.receipt.crmReference, "101");
  const order = crmOrders.get(receipt.number);
  order.payments.push({
    id: "payment-1",
    status: "paid",
    amount: order.totalAmount,
    currency: "UAH",
    refundedAmount: null,
    createdAt: new Date().toISOString(),
  });
  const paid = await currentReceipt(receipt);
  assert.equal(paid.receipt.status, "paid");
  assert.equal(paid.receipt.note, "Оплату підтверджено.");
});

test("a refused CRM order preserves the basket and never starts a payment", async () => {
  setCart([{ p: "p1", q: 1 }]);
  failOrder = true;
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  assert.equal((await placeOrderAction({}, checkoutData())).status, "error");
  assert.equal(savedOrders.length, 0);
  assert.equal(
    requests.some((request) => request.url.endsWith("/payment-link")),
    false,
  );
  assert.ok(cookieValues.has("cjp_cart_v2"));
});

test("a provider failure retains the accepted order and retries payment without another order", async () => {
  setCart([{ p: "p1", q: 1 }]);
  failPayment = true;
  const { placeOrderAction, retryPaymentAction } = load(
    "src/features/checkout/actions.ts",
  );
  await assert.rejects(
    placeOrderAction({}, checkoutData()),
    /redirect:\/checkout\/success/,
  );
  assert.equal(savedOrders.length, 1);
  assert.ok(cookieValues.has("cjp_cart_v2"));
  failPayment = false;
  await assert.rejects(retryPaymentAction(), /redirect:https:/);
  assert.equal(savedOrders.length, 1);
});

test("unavailable payment and invalid carrier refs fail before creating an order", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  capabilities.payments = [{ key: "cod", status: "active" }];
  assert.equal((await placeOrderAction({}, checkoutData())).status, "error");
  capabilities.payments.push({
    key: "monobank",
    status: "active",
    paymentLink: true,
  });
  assert.equal(
    (await placeOrderAction({}, checkoutData({ branchRef: STREET_REF })))
      .status,
    "error",
  );
  invalidAddress = true;
  assert.equal((await placeOrderAction({}, checkoutData())).status, "error");
  assert.equal(savedOrders.length, 0);
});

test("courier delivery preserves the city street reference and structured building and flat", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(
    placeOrderAction(
      {},
      checkoutData({
        delivery: "np-courier",
        branchRef: "",
        streetRef: STREET_REF,
        streetSearch: "Street",
        building: "12",
        flat: "5",
        payment: "cod",
      }),
    ),
    /redirect:\/checkout\/success/,
  );
  assert.equal(savedOrders[0].delivery.streetRef, STREET_REF);
  assert.equal(savedOrders[0].delivery.building, "12");
  assert.equal(savedOrders[0].delivery.flat, "5");
  assert.equal(savedOrders[0].delivery.method, "courier");
  assert.equal(savedOrders[0].delivery.cod, true);
  assert.equal(savedOrders[0].delivery.branchRef, undefined);
});

test("a changed basket survives payment settlement for the previous order", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  const order = crmOrders.values().next().value;
  order.payments = [
    {
      id: "p",
      status: "paid",
      amount: "420.00",
      currency: "UAH",
      refundedAmount: null,
      createdAt: new Date().toISOString(),
    },
  ];
  setCart([{ p: "p1", q: 2 }]);
  const { settleCheckoutReturn } = load(
    "src/features/checkout/payment/settlement.ts",
  );
  assert.equal((await settleCheckoutReturn()).status, "paid");
  assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart_v2")), [
    { p: "p1", q: 2 },
  ]);
});

test("an altered encrypted checkout cookie cannot read or charge an order", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction, retryPaymentAction } = load(
    "src/features/checkout/actions.ts",
  );
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  cookieValues.set("cjp_checkout", "tampered");
  const before = requests.length;
  await assert.rejects(retryPaymentAction(), /redirect:\/checkout$/);
  assert.equal(requests.length, before);
});

test("authorized and partially paid money do not mark the whole order paid", () => {
  const { crmPaymentStatus } = load("src/features/checkout/payment/status.ts");
  const order = {
    status: "pending",
    currency: "UAH",
    totalAmount: "420.00",
    payments: [],
  };
  const payment = {
    id: "p",
    amount: "420.00",
    currency: "UAH",
    refundedAmount: null,
    createdAt: new Date().toISOString(),
  };
  order.payments = [{ ...payment, status: "authorized" }];
  assert.equal(crmPaymentStatus(order, "card"), "pending");
  order.payments = [{ ...payment, status: "paid", amount: "200.00" }];
  assert.equal(crmPaymentStatus(order, "card"), "pending");
  order.payments = [
    { ...payment, status: "partially_refunded", refundedAmount: null },
  ];
  assert.equal(crmPaymentStatus(order, "card"), "partially-refunded");
  order.payments = [{ ...payment, status: "paid", currency: "EUR" }];
  assert.equal(crmPaymentStatus(order, "card"), "pending");
  order.payments = [{ ...payment, status: "paid" }];
  assert.equal(crmPaymentStatus(order, "card"), "paid");
});

test("cart shipping terms are read from the CRM without an invented threshold", async () => {
  const { loadCart } = load("src/features/cart/queries.ts");
  const { CartSummary } = load("src/features/cart/components/cart-summary.tsx");
  const buildCart = async (stored) => (await loadCart(stored)).cart;
  let cart = await buildCart([{ p: "p1", q: 1 }]);
  assert.equal(cart.freeShipping, false);
  assert.equal(cart.freeShippingThreshold, null);
  assert.equal(cart.freeShippingRemainder, null);
  assert.doesNotMatch(
    renderToStaticMarkup(React.createElement(CartSummary, { cart })),
    /Безкоштовна доставка від/,
  );
  capabilities.cart.freeShippingThreshold = 400;
  cart = await buildCart([{ p: "p1", q: 1 }]);
  assert.equal(cart.freeShipping, true);
  assert.equal(cart.freeShippingThreshold, 40000);
  assert.match(
    renderToStaticMarkup(React.createElement(CartSummary, { cart })),
    /Безкоштовна доставка від 400\s₴ суми товарів/,
  );
  capabilities.cart.byCurrency = [
    { currency: "UAH", freeShippingThreshold: 1500, minOrderAmount: 500 },
  ];
  cart = await buildCart([{ p: "p1", q: 1 }]);
  assert.equal(cart.freeShipping, false);
  assert.equal(cart.freeShippingThreshold, 150000);
  assert.equal(cart.freeShippingRemainder, 108000);
  assert.equal(cart.minOrderAmount, 50000);
  assert.equal(cart.minOrderRemainder, 8000);
  const markup = renderToStaticMarkup(
    React.createElement(CartSummary, { cart }),
  );
  assert.match(markup, /Безкоштовна доставка від 1\s500\s₴ суми товарів/);
  assert.match(markup, /Додайте ще на 1\s080\s₴/);
  assert.match(markup, /Мінімальна сума замовлення — 500\s₴/);
  assert.doesNotMatch(markup, /Оформити замовлення/);
});

test("confirmation page waits for CRM payment, then shows paid, and never claims success during a CRM outage", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  const { default: Page } = load("src/app/checkout/success/page.tsx");
  const receiptElement = Page({ searchParams: Promise.resolve({}) }).props
    .children.props.children;
  async function renderReceipt() {
    return renderToStaticMarkup(
      await receiptElement.type(receiptElement.props),
    );
  }
  const pending = await renderReceipt();
  assert.match(pending, /Очікуємо підтвердження банку/);
  assert.match(pending, /Перевіряємо оплату…/);
  assert.match(pending, /class="spinner"/);
  assert.doesNotMatch(pending, /Перейти до оплати/);
  const order = [...crmOrders.values()][0];
  order.payments.push({
    id: "payment-1",
    status: "paid",
    amount: order.totalAmount,
    currency: "UAH",
    refundedAmount: null,
    createdAt: new Date().toISOString(),
  });
  const paid = await renderReceipt();
  assert.match(paid, /Оплачено/);
  assert.match(paid, /Оплату підтверджено/);
  assert.doesNotMatch(paid, /class="spinner"/);
  failApi = true;
  const unavailable = await renderReceipt();
  assert.match(unavailable, /Статус тимчасово недоступний/);
  assert.doesNotMatch(unavailable, /Оплачено|Оплату підтверджено/);
});

test("a changed checkout total asks for confirmation before creating any order or payment", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const data = checkoutData();
  products[0].price = 500;
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const result = await placeOrderAction({}, data);
  assert.equal(result.status, "error");
  assert.match(result.message, /Сума замовлення змінилася/);
  assert.equal(savedOrders.length, 0);
  assert.equal(
    requests.some((r) => r.url.endsWith("/payment-link")),
    false,
  );
  assert.equal(refreshes, 1);
  assert.ok(cookieValues.has("cjp_cart_v2"));
});

test("malformed or missing quantities do not become default or truncated purchases", async () => {
  const { addToCartAction } = load("src/features/cart/actions.ts");
  for (const value of ["", "abc", "2abc", "2.9", "1e3", "9007199254740992"]) {
    setCart([{ p: "p1", q: 2 }]);
    assert.equal((await addToCartAction({}, form(value))).status, "error");
    assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart_v2")), [
      { p: "p1", q: 2 },
    ]);
  }
});

test("fractional hryvnia prices preserve kopiyky and unsafe totals are refused", () => {
  const { formatMoney, sumMoney } = load("src/lib/money.ts");
  assert.match(formatMoney(42050), /420,5/);
  assert.equal(sumMoney([42050, 1]), 42051);
  assert.throws(() => sumMoney([Number.MAX_SAFE_INTEGER, 1]), RangeError);
  const { crmOrderSchema } = load("src/features/checkout/crm/types.ts");
  assert.equal(
    crmOrderSchema.safeParse({
      id: "order",
      externalId: "ext",
      number: null,
      status: "pending",
      currency: "UAH",
      totalAmount: "420.00",
      shipments: [],
      payments: [
        {
          id: "payment",
          status: "paid",
          currency: "UAH",
          amount: "999999999999999999999.00",
          refundedAmount: null,
          createdAt: new Date().toISOString(),
        },
      ],
    }).success,
    false,
  );
});

test("the shop excludes draft and unpublished CRM products even if the API returns them", async () => {
  products = [
    product(),
    product({ id: "draft", status: "draft" }),
    product({ id: "hidden", storefrontVisible: false }),
  ];
  const { getCurrentProducts } = load("src/features/catalog/queries.ts");
  assert.equal((await getCurrentProducts()).length, 1);
});

test("malformed CRM catalog data fails closed rather than becoming a purchaseable product", async () => {
  products = [product({ price: "420" })];
  const { addToCartAction } = load("src/features/cart/actions.ts");
  assert.equal((await addToCartAction({}, form(1))).status, "error");
  assert.equal(cookieValues.has("cjp_cart_v2"), false);
});

test("HTML descriptions use a parser to preserve allowed markup and remove executable content", async () => {
  products = [
    product({
      descriptionHtml:
        '<p onclick="evil()">Hello<script>evil()</script><img src=x onerror="evil()"><strong>safe</strong></p>',
    }),
  ];
  const { getCurrentProducts } = load("src/features/catalog/queries.ts");
  const catalog = await getCurrentProducts();
  assert.equal(catalog[0].descriptionHtml, "<p>Hello<strong>safe</strong></p>");
});

test("incomplete or repeated CRM pages cannot silently produce a partial catalog", async () => {
  const { fetchProducts } = load("src/features/catalog/crm-api.ts");
  let reads = 0;
  global.fetch = async () => {
    reads++;
    return Response.json({
      data: reads === 1 ? [product()] : [],
      pagination: { page: reads, perPage: 100, total: 2 },
    });
  };
  await assert.rejects(fetchProducts(), /INCOMPLETE_CATALOG/);
  global.fetch = async () =>
    Response.json({
      data: [product()],
      pagination: { page: 1, perPage: 100, total: 2 },
    });
  await assert.rejects(fetchProducts(), /INVALID_PAGINATION/);
});

test("concurrent requests from one signed checkout form use one CRM order key", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const results = await Promise.allSettled([
    placeOrderAction({}, checkoutData()),
    placeOrderAction({}, checkoutData()),
  ]);
  assert.equal(savedOrders.length, 1);
  assert.equal(
    new Set(
      requests
        .filter((r) => r.url.endsWith("/orders") && r.options.body)
        .map((r) => JSON.parse(r.options.body).externalId),
    ).size,
    1,
  );
  assert.ok(
    results.every(
      (result) =>
        result.status === "rejected" &&
        /redirect:https:/.test(result.reason.message),
    ),
  );
});

test("a forged checkout form token cannot create an order or charge a payment", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const result = await placeOrderAction(
    {},
    checkoutData({ checkoutToken: "forged" }),
  );
  assert.equal(result.status, "error");
  assert.equal(savedOrders.length, 0);
  assert.equal(
    requests.some((r) => r.url.endsWith("/payment-link")),
    false,
  );
  assert.equal(refreshes, 1);
});

test("a new signed form after a completed COD purchase creates a new order while replaying the old form does not", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const oldForm = checkoutData({ payment: "cod" });
  await assert.rejects(
    placeOrderAction({}, oldForm),
    /redirect:\/checkout\/success/,
  );
  setCart([{ p: "p1", q: 1 }]);
  await assert.rejects(
    placeOrderAction({}, oldForm),
    /redirect:\/checkout\/success/,
  );
  assert.equal(savedOrders.length, 1);
  setCart([{ p: "p1", q: 1 }]);
  formToken = await load(
    "src/features/checkout/checkout-attempt.ts",
  ).createCheckoutToken();
  await assert.rejects(
    placeOrderAction({}, checkoutData({ payment: "cod" })),
    /redirect:\/checkout\/success/,
  );
  assert.equal(savedOrders.length, 2);
});

async function renderReturn(query = {}) {
  const { default: Page } = load("src/app/checkout/success/page.tsx");
  const element = Page({ searchParams: Promise.resolve(query) }).props.children
    .props.children;
  return renderToStaticMarkup(await element.type(element.props));
}

test("a confirmation without a session or a valid return proof renders recovery, not 404", async () => {
  assert.match(await renderReturn(), /Не вдалося відкрити замовлення/);
  assert.match(
    await renderReturn({ token: "forged" }),
    /Не вдалося відкрити замовлення/,
  );
  assert.equal(requests.length, 0);
});

test("a signed bank return restores the actual CRM status without cookies and preserves a different basket", async () => {
  process.env.SITE_URL = "https://curly-joy.com";
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction, checkPaymentStatusAction } = load(
    "src/features/checkout/actions.ts",
  );
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  const token = new URL(link.returnUrl).searchParams.get("token");
  cookieValues.delete("cjp_checkout");
  setCart([{ p: "p1", q: 2 }]);
  assert.match(await renderReturn({ token }), /Очікуємо підтвердження банку/);
  const order = [...crmOrders.values()][0];
  order.payments.push({
    id: "payment-1",
    status: "paid",
    amount: order.totalAmount,
    currency: "UAH",
    refundedAmount: null,
    createdAt: new Date().toISOString(),
  });
  await checkPaymentStatusAction(token);
  assert.match(await renderReturn({ token }), /Оплату підтверджено/);
  assert.equal(
    (await load("src/features/checkout/receipt-cookie.ts").readReceiptCookie())
      .number,
    order.externalId,
  );
  assert.deepEqual(
    await load("src/features/cart/cart-cookie.ts").readCartCookie(),
    [{ p: "p1", q: 2 }],
  );
});

test("cookie-less bank return handles a CRM outage truthfully and rejects a checkout-purpose token", async () => {
  process.env.SITE_URL = "https://curly-joy.com";
  setCart([{ p: "p1", q: 1 }]);
  await assert.rejects(
    load("src/features/checkout/actions.ts").placeOrderAction(
      {},
      checkoutData(),
    ),
    /redirect:https:/,
  );
  const token = new URL(link.returnUrl).searchParams.get("token");
  cookieValues.delete("cjp_checkout");
  failApi = true;
  assert.match(await renderReturn({ token }), /Статус тимчасово недоступний/);
  assert.doesNotMatch(
    await renderReturn({ token }),
    /Оплачено|Оплату підтверджено/,
  );
  failApi = false;
  const reads = requests.length;
  assert.match(
    await renderReturn({ token: formToken }),
    /Не вдалося відкрити замовлення/,
  );
  assert.equal(requests.length, reads);
});

function crmPaths() {
  return requests.map(({ url }) => new URL(url).pathname);
}

test("the header count reads the cached catalog, not fresh stock, and survives a CRM outage", async () => {
  setCart([
    { p: "p1", q: 30 },
    { p: "gone", q: 1 },
  ]);
  const { getCartItemCount } = load("src/features/cart/queries.ts");
  assert.equal(await getCartItemCount(), 25);
  assert.ok(cacheReads > 0);
  assert.equal(
    crmPaths().some((path) => path.endsWith("/capabilities")),
    false,
  );
  failApi = true;
  assert.equal(await getCartItemCount(), 31);
});

test("product pages share a catalog read under a minute old, tagged with the catalog, invented slugs included", async () => {
  const { getRecentProduct } = load("src/features/catalog/queries.ts");
  assert.equal((await getRecentProduct("sku-1")).variants[0].stock, 25);
  assert.equal(await getRecentProduct("invented-slug"), null);
  for (const profile of cacheProfiles) assert.ok(profile.expire <= 60);
  assert.equal(cacheProfiles.length, 2);
  assert.ok(cachedTags.includes("catalog"));
});

test("cart and checkout pages explain a CRM outage instead of failing the whole page", async () => {
  setCart([{ p: "p1", q: 1 }]);
  failApi = true;
  const { CartView } = load("src/features/cart/components/cart-view.tsx");
  assert.match(
    renderToStaticMarkup(await CartView()),
    /Не вдалося завантажити кошик/,
  );
  const { default: CheckoutPage } = load("src/app/checkout/page.tsx");
  const content = CheckoutPage().props.children[1].props.children;
  assert.match(
    renderToStaticMarkup(await content.type(content.props)),
    /Оформлення тимчасово недоступне/,
  );
  assert.ok(cookieValues.has("cjp_cart_v2"));
});

test("legacy HttpOnly cart is read once and moved to the browser cart on server write", async () => {
  cookieValues.set("cjp_cart", JSON.stringify([{ p: "p1", q: 2 }]));
  const { readCartCookie } = load("src/features/cart/cart-cookie.ts");
  assert.deepEqual(await readCartCookie(), [{ p: "p1", q: 2 }]);
  const { addToCartAction } = load("src/features/cart/actions.ts");
  assert.equal((await addToCartAction({}, form(1))).status, "success");
  assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart_v2")), [
    { p: "p1", q: 3 },
  ]);
  assert.equal(cookieValues.has("cjp_cart"), false);
});

test("an empty browser cart cannot revive an older HttpOnly cart", async () => {
  cookieValues.set("cjp_cart", JSON.stringify([{ p: "p1", q: 2 }]));
  cookieValues.set("cjp_cart_v2", "[]");
  const { readCartCookie } = load("src/features/cart/cart-cookie.ts");
  assert.deepEqual(await readCartCookie(), []);
});

test("a product without a SKU is not sold: the CRM could not link its order line", async () => {
  products = [
    product({ sku: null }),
    product({ id: "p2", sku: "  " }),
    product({ id: "p3", sku: "SKU-3" }),
  ];
  const { getCurrentProducts } = load("src/features/catalog/queries.ts");
  assert.deepEqual(
    (await getCurrentProducts()).flatMap((item) =>
      item.variants.map((variant) => variant.sku),
    ),
    ["SKU-3"],
  );
});

test("prices show kopiyky as two digits and whole hryvnias without them", () => {
  const { formatMoney } = load("src/lib/money.ts");
  assert.match(formatMoney(19950), /^199,50\s₴$/);
  assert.match(formatMoney(19955), /^199,55\s₴$/);
  assert.match(formatMoney(19900), /^199\s₴$/);
});

test("a phone number missing a digit is refused instead of becoming an impossible +380 0… number", () => {
  const { normalizePhone } = load("src/features/checkout/validation.ts");
  for (const typo of ["067 440 439", "+380 067 440 439", "0067440439"])
    assert.equal(normalizePhone(typo), null);
  for (const phone of ["67 440 43 94", "067 440 43 94", "+38 (067) 440-43-94"])
    assert.equal(normalizePhone(phone), "+380674404394");
});

test("the order keeps the free shipping the cart showed and checks out with one read of CRM terms", async () => {
  setCart([{ p: "p1", q: 1 }]);
  capabilities.cart.freeShippingThreshold = 10000;
  capabilities.cart.byCurrency = [
    { currency: "UAH", freeShippingThreshold: 400, minOrderAmount: null },
  ];
  const { getCart } = load("src/features/cart/queries.ts");
  assert.equal((await getCart()).freeShipping, true);
  const before = crmPaths().length;
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(
    placeOrderAction({}, checkoutData({ payment: "cod" })),
    /redirect:\/checkout\/success/,
  );
  assert.match(savedOrders[0].notes, /Доставка коштом магазину/);
  assert.equal(
    crmPaths()
      .slice(before)
      .filter((path) => path.endsWith("/capabilities")).length,
    1,
  );
});

test("the minimum order comes from the CRM's hryvnia terms", async () => {
  setCart([{ p: "p1", q: 1 }]);
  capabilities.cart.byCurrency = [
    { currency: "UAH", freeShippingThreshold: null, minOrderAmount: 500 },
  ];
  const { default: CheckoutPage } = load("src/app/checkout/page.tsx");
  const content = CheckoutPage().props.children[1].props.children;
  const checkout = renderToStaticMarkup(await content.type(content.props));
  assert.match(checkout, /Мінімальна сума замовлення — 500\s₴/);
  assert.match(checkout, /Додайте товарів ще на 80\s₴/);
  assert.doesNotMatch(checkout, /Оформлюємо…|Перейти до оплати/);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const result = await placeOrderAction({}, checkoutData({ payment: "cod" }));
  assert.equal(result.status, "error");
  assert.match(result.message, /Мінімальна сума замовлення — 500\s₴/);
  assert.equal(savedOrders.length, 0);
});

test("a bank that cannot be opened leaves an unpaid order with a pay button, not a wait for the bank", async () => {
  setCart([{ p: "p1", q: 1 }]);
  failPayment = true;
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(
    placeOrderAction({}, checkoutData()),
    /redirect:\/checkout\/success\?payment=unavailable$/,
  );
  const page = await renderReturn({ payment: "unavailable" });
  assert.match(page, /Не вдалося відкрити оплату/);
  assert.match(page, /<button[^>]*>Перейти до оплати<\/button>/);
  assert.doesNotMatch(page, /Перевіряємо оплату…|class="spinner"/);
  // Without the hint the CRM tells the same: no payment was ever opened.
  const later = await renderReturn();
  assert.match(later, /Оплату ще не розпочато/);
  assert.match(later, /Не оплачено/);
  assert.match(later, /<button[^>]*>Перейти до оплати<\/button>/);
  assert.doesNotMatch(later, /class="spinner"/);
});

test("a failed payment retry keeps the return token and reports that the bank could not be opened", async () => {
  process.env.SITE_URL = "https://curly-joy.com";
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction, retryPaymentAction } = load(
    "src/features/checkout/actions.ts",
  );
  await assert.rejects(placeOrderAction({}, checkoutData()), /redirect:https:/);
  const token = new URL(link.returnUrl).searchParams.get("token");
  link = null;
  failPayment = true;
  await assert.rejects(retryPaymentAction(token), (error) => {
    const url = new URL(
      error.message.slice("redirect:".length),
      "https://curly-joy.com",
    );
    return (
      url.pathname === "/checkout/success" &&
      url.searchParams.get("token") === token &&
      url.searchParams.get("payment") === "unavailable"
    );
  });
});

test("a branch is confirmed against the same CRM search that offered it, across the whole city", async () => {
  setCart([{ p: "p1", q: 1 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  await assert.rejects(
    placeOrderAction({}, checkoutData({ branchSearch: "1" })),
    /redirect:https:/,
  );
  const lookup = requests
    .map(({ url }) => new URL(url))
    .find((url) => url.pathname.endsWith("/warehouses"));
  assert.equal(lookup.searchParams.get("cityRef"), CITY_REF);
  assert.equal(lookup.searchParams.get("q"), "1");
  assert.equal(lookup.searchParams.get("perPage"), "100");
  const { searchWarehousesAction } = load(
    "src/features/checkout/nova-poshta.actions.ts",
  );
  assert.deepEqual(await searchWarehousesAction(CITY_REF, ""), {
    ok: true,
    data: {
      items: [{ ref: BRANCH_REF, label: "Branch 1", number: "1" }],
      total: 1,
    },
  });
  assert.equal(new URL(requests.at(-1).url).searchParams.has("q"), false);
});

test("a production server without SITE_URL sends buyers back to the shop's own address, never localhost", () => {
  delete process.env.SITE_URL;
  const environment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const { siteUrl } = load("src/lib/origin.ts");
    assert.equal(
      siteUrl("/checkout/success"),
      "https://curly-joy.com/checkout/success",
    );
  } finally {
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
  }
});
