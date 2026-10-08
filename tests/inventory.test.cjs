const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test, beforeEach } = require("node:test");
const swc = require("next/dist/build/swc");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

// Run the real TS modules with only framework IO, the CRM transport and order
// persistence replaced. No network requests, CRM writes or payments in tests.
const root = path.resolve(__dirname, "..");
const modules = new Map();
const cookieValues = new Map();
let products, requests, savedOrders, refreshes, failApi, cacheReads;
const mocks = {
  "server-only": {},
  "next/cache": {
    refresh: () => { refreshes++; },
    cacheLife: () => { cacheReads++; },
    cacheTag: () => {},
  },
  "next/headers": {
    cookies: async () => ({
      get: (name) => cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
      set: (name, value) => cookieValues.set(name, value),
      delete: (name) => cookieValues.delete(name),
    }),
  },
  "next/navigation": { redirect: (url) => { throw new Error(`redirect:${url}`); } },
  "next/link": { default: ({ children }) => React.createElement("a", null, children) },
  "@/components/ui/button": {
    Button: ({ children, type, disabled, className }) => React.createElement("button", { type, disabled, className }, children),
  },
  "@/components/ui/price": { Price: () => React.createElement("span", null, "price") },
  "@/features/checkout/crm": { crmProvider: () => null },
  "@/features/checkout/order-repository": {
    reserveOrderNumber: async () => "TEST-1",
    saveOrder: async (order) => { savedOrders.push(order); },
  },
  "@/features/checkout/payment": {
    paymentProvider: { createPayment: async () => ({ note: "", redirectUrl: "/checkout/success" }) },
  },
  "@/features/checkout/payment/checkout-cookie": {
    clearLiqPayCheckoutCookie: async () => {},
  },
  "@/features/checkout/payment/liqpay": {},
  "@/features/checkout/payment/settlement": {},
  "@/features/checkout/receipt-cookie": { writeReceiptCookie: async () => {} },
};

function load(filename) {
  filename = path.resolve(root, filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const { code } = swc.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    jsc: { parser: { syntax: "typescript", tsx: filename.endsWith(".tsx") }, target: "es2022", transform: { react: { runtime: "automatic" } } },
    module: { type: "commonjs" },
  });
  function localRequire(name) {
    const absolute = name.startsWith("@/")
      ? path.join(root, "src", name.slice(2))
      : name.startsWith(".") ? path.resolve(path.dirname(filename), name) : null;
    const key = absolute ? "@/" + path.relative(path.join(root, "src"), absolute).replaceAll("\\", "/") : name;
    if (Object.hasOwn(mocks, key)) return mocks[key];
    if (name.endsWith(".css")) return new Proxy({}, { get: (_, key) => String(key) });
    if (!absolute) return require(name);
    return load([absolute + ".ts", absolute + ".tsx", path.join(absolute, "index.ts")].find(fs.existsSync));
  }
  new Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports;
}

function product(overrides = {}) {
  return { id: "p1", sku: "SKU-1", name: "Product", currency: "UAH", price: 420, stock: 25, availability: "in_stock", images: [], ...overrides };
}
function setCart(lines) { cookieValues.set("cjp_cart", JSON.stringify(lines)); }
function form(quantity, variantId = "p1") {
  const data = new FormData();
  data.set("variantId", variantId);
  data.set("quantity", String(quantity));
  return data;
}
async function renderProduct() {
  const { getCurrentProduct } = load("src/features/catalog/queries.ts");
  const current = await getCurrentProduct("sku-1");
  const { AddToCartForm } = load("src/features/cart/components/add-to-cart-form.tsx");
  return renderToStaticMarkup(React.createElement(AddToCartForm, { optionName: current.optionName, variants: current.variants }));
}

beforeEach(() => {
  products = [product()]; requests = []; savedOrders = []; refreshes = 0; cacheReads = 0; failApi = false;
  cookieValues.clear();
  process.env.OBRIYM_CRM_API_KEY = "test-token";
  process.env.OBRIYM_CRM_API_URL = "https://crm.test/api/v1";
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (failApi) throw new Error("CRM unavailable");
    return Response.json({ data: products, pagination: { page: 1, perPage: 100, total: products.length } });
  };
});

test("sold-out product shows quantity zero and disables both quantity buttons", async () => {
  products = [product({ stock: 0, availability: "out_of_stock" })];
  const html = await renderProduct();
  assert.match(html, /name="quantity" value="0"/);
  assert.match(html, /aria-label="Зменшити кількість" disabled=""/);
  assert.match(html, /aria-label="Збільшити кількість" disabled=""/);
  assert.match(html, /disabled="">Немає в наявності/);
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
  assert.doesNotMatch(html, /У наявності:|Максимум|aria-label="Збільшити кількість" disabled/);
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
  assert.equal(JSON.parse(cookieValues.get("cjp_cart"))[0].q, 20);
  assert.equal((await addToCartAction({}, form(5))).status, "success");
});

test("cart quantity changes use fresh stock and remove sold-out items", async () => {
  const { setLineQuantityAction } = load("src/features/cart/actions.ts");
  setCart([{ p: "p1", q: 12 }]);
  products[0].stock = 3;
  await setLineQuantityAction(form(13));
  assert.equal(JSON.parse(cookieValues.get("cjp_cart"))[0].q, 3);
  products[0].availability = "out_of_stock";
  await setLineQuantityAction(form(2));
  assert.equal(cookieValues.has("cjp_cart"), false);
});

test("cart reads current prices and all lines from one CRM snapshot", async () => {
  products = [product({ price: 500 }), product({ id: "p2", sku: "SKU-2", stock: 2 })];
  const { buildCart } = load("src/features/cart/queries.ts");
  const cart = await buildCart([{ p: "p1", q: 12 }, { p: "p2", q: 3 }]);
  assert.equal(cart.lines[0].unitPrice, 50000);
  assert.equal(cart.lines[1].quantity, 2);
  assert.equal(requests.length, 1);
});

test("checkout stops before saving an order if stock has decreased", async () => {
  setCart([{ p: "p1", q: 5 }]);
  products[0].stock = 2;
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  const result = await placeOrderAction({}, new FormData());
  assert.equal(result.status, "error");
  assert.match(result.message, /Наявність товарів змінилася/);
  assert.equal(savedOrders.length, 0);
  assert.equal(JSON.parse(cookieValues.get("cjp_cart"))[0].q, 2);
});

test("checkout does not silently submit only the surviving cart items", async () => {
  setCart([{ p: "p1", q: 2 }, { p: "p2", q: 1 }]);
  products = [product({ stock: 0 }), product({ id: "p2", sku: "SKU-2" })];
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  assert.equal((await placeOrderAction({}, new FormData())).status, "error");
  assert.equal(savedOrders.length, 0);
  assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart")), [{ p: "p2", q: 1 }]);
});

test("CRM failure prevents additions and checkout without changing the cart", async () => {
  setCart([{ p: "p1", q: 12 }]);
  failApi = true;
  const { addToCartAction } = load("src/features/cart/actions.ts");
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  assert.equal((await addToCartAction({}, form(1))).status, "error");
  assert.equal((await placeOrderAction({}, new FormData())).status, "error");
  assert.equal(savedOrders.length, 0);
  assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart")), [{ p: "p1", q: 12 }]);
});

test("invalid and fractional CRM stocks never create zero-quantity order lines", async () => {
  const { buildCart } = load("src/features/cart/queries.ts");
  for (const stock of [undefined, -1, 0.5, "5"]) {
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
  for (const [key, value] of Object.entries({
    firstName: "Test", lastName: "Customer", phone: "+380670000000",
    email: "customer@example.test", city: "Kyiv", destination: "1", delivery: "np-branch", payment: "cod",
  })) data.set(key, value);
  await assert.rejects(placeOrderAction({}, data), /redirect:\/checkout\/success/);
  assert.equal(savedOrders.length, 1);
  assert.equal(savedOrders[0].items[0].quantity, 20);
  assert.equal(savedOrders[0].items[0].unitPrice, 42000);
  assert.equal(savedOrders[0].subtotal, 840000);
});

test("duplicate cookie lines cannot bypass the per-product stock check", async () => {
  products[0].stock = 3;
  setCart([{ p: "p1", q: 2 }, { p: "p1", q: 2 }]);
  const { placeOrderAction } = load("src/features/checkout/actions.ts");
  assert.equal((await placeOrderAction({}, new FormData())).status, "error");
  assert.equal(savedOrders.length, 0);
  assert.deepEqual(JSON.parse(cookieValues.get("cjp_cart")), [{ p: "p1", q: 3 }]);
});
