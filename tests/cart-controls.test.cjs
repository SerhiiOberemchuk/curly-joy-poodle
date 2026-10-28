const assert = require("node:assert/strict");
const { test, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/cart",
});
for (const name of ["window", "document", "HTMLElement", "Element", "Node", "MutationObserver", "location"]) {
  globalThis[name] = dom.window[name];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const { render, screen, fireEvent, cleanup } = require("@testing-library/react");
const { createLoader } = require("./load-modules.cjs");
const load = createLoader({
  "next/link": {
    __esModule: true,
    default: ({ children, href, className }) => React.createElement("a", { href, className }, children),
  },
  "@/components/ui/button": { buttonStyles: () => "button" },
  "@/features/catalog/components/product-artwork": {
    ProductArtwork: () => React.createElement("div"),
  },
  "server-only": {},
  "next/headers": {
    cookies: async () => ({
      get: (name) => {
        const pair = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
        return pair ? { value: pair.slice(name.length + 1) } : undefined;
      },
    }),
  },
});
const { CartStoreProvider, createCartStore, useCartStore, useCartStoreApi } = load(
  "src/features/cart/cart-store.tsx",
);
const { CartLineControls } = load(
  "src/features/cart/components/cart-line-controls.tsx",
);
const { CartSummary } = load("src/features/cart/components/cart-summary.tsx");
const { calculateCart } = load("src/features/cart/calculate.ts");
const { readCartCookie } = load("src/features/cart/cart-cookie.ts");
const { CartClient } = load("src/features/cart/components/cart-client.tsx");

afterEach(() => {
  cleanup();
  document.cookie = "cjp_cart_v2=; Path=/; Max-Age=0";
});

test("legacy cart migration preserves its lines and assigns an edit revision", async () => {
  const { ensureBrowserCartRevision } = load("src/features/cart/cart-cookie.client.ts");
  const { parseCartSnapshot } = load("src/features/cart/cart-cookie-data.ts");
  const lines = [{ p: "p1", q: 2 }, { p: "p2", q: 1 }];
  document.cookie = `cjp_cart_v2=${encodeURIComponent(JSON.stringify(lines))}; Path=/`;
  ensureBrowserCartRevision([]);
  const raw = document.cookie.split("; ").find((part) => part.startsWith("cjp_cart_v2=")).slice("cjp_cart_v2=".length);
  const snapshot = parseCartSnapshot(raw);
  assert.deepEqual(snapshot.lines, lines);
  assert.ok(snapshot.revision);
  const before = document.cookie;
  ensureBrowserCartRevision([]);
  assert.equal(document.cookie, before);
});

function sampleCart() {
  return calculateCart(
    [{
      variantId: "p1",
      slug: "test",
      title: "Бальзам для лапок",
      option: null,
      sku: "MYW-00008",
      image: undefined,
      quantity: 4,
      unitPrice: 32000,
      lineTotal: 128000,
      maxQuantity: 8,
    }],
    { freeShippingThreshold: 150000, minOrderAmount: null },
  );
}

test("plus and minus change the displayed quantity, total and shipping immediately", async () => {
  const initialCart = sampleCart();
  let observedStore;

  function Content() {
    const store = useCartStoreApi();
    observedStore = store;
    const cart = useCartStore((state) => state.cart);
    React.useEffect(() => { store.getState().hydrate(initialCart); }, [store]);
    if (!cart) return null;
    const line = cart.lines[0];
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(CartLineControls, { line }),
      React.createElement(CartSummary, { cart }),
    );
  }

  render(React.createElement(CartStoreProvider, null, React.createElement(Content)));
  fireEvent.click(screen.getByRole("button", { name: /Збільшити кількість/ }));
  assert.match(screen.getByText(/Товари \(5 шт\.\)/).textContent, /5 шт/);
  assert.match(screen.getByText(/Разом за товари/).parentElement.textContent, /1\s?600\s?₴/);
  assert.equal(screen.queryByText(/Додайте ще на/), null);
  assert.deepEqual(await readCartCookie(), [{ p: "p1", q: 5 }]);

  document.cookie = `cjp_cart_v2=${encodeURIComponent(JSON.stringify([
    { p: "p1", q: 5 }, { p: "p2", q: 1 },
  ]))}; Path=/`;

  fireEvent.click(screen.getByRole("button", { name: /Зменшити кількість/ }));
  assert.match(screen.getByText(/Товари \(4 шт\.\)/).textContent, /4 шт/);
  assert.ok(screen.getByText(/Додайте ще на/));
  assert.deepEqual(await readCartCookie(), [
    { p: "p1", q: 4 }, { p: "p2", q: 1 },
  ]);
  // A line added in another tab is kept for checkout, without asking for a reload.
  assert.equal(observedStore.getState().error, null);
  assert.ok(screen.getByRole("link", { name: "Оформити замовлення" }));
});

test("a quantity change writes only its own line over another tab's changes", async () => {
  document.cookie = `cjp_cart_v2=${encodeURIComponent(JSON.stringify([
    { p: "p2", q: 3 },
  ]))}; Path=/`;
  const store = createCartStore();
  store.getState().hydrate(sampleCart());
  store.getState().setQuantity("p1", 5);
  assert.deepEqual(await readCartCookie(), [{ p: "p2", q: 3 }, { p: "p1", q: 5 }]);
  assert.equal(store.getState().error, null);
});

test("a change the cookie cannot hold is undone instead of shown", async () => {
  const otherLines = Array.from({ length: 30 }, (_, index) => ({ p: `o${index}`, q: 1 }));
  document.cookie = `cjp_cart_v2=${encodeURIComponent(JSON.stringify(otherLines))}; Path=/`;
  const store = createCartStore();
  store.getState().hydrate(sampleCart());
  store.getState().setQuantity("p1", 5);
  assert.equal(store.getState().cart.lines[0].quantity, 4);
  assert.match(store.getState().error, /30 позицій/);
  assert.doesNotMatch(store.getState().error, /Оновіть сторінку/);
  assert.deepEqual(await readCartCookie(), otherLines);
});

test("the first browser write keeps the rendered lines of a cart only the old HttpOnly cookie held", async () => {
  const cart = sampleCart();
  const legacy = calculateCart(
    [...cart.lines, { ...cart.lines[0], variantId: "p2", quantity: 2 }],
    { freeShippingThreshold: 150000, minOrderAmount: null },
  );
  const store = createCartStore();
  store.getState().hydrate(legacy);
  store.getState().setQuantity("p1", 5);
  assert.deepEqual(await readCartCookie(), [{ p: "p1", q: 5 }, { p: "p2", q: 2 }]);
  store.getState().remove("p1");
  assert.deepEqual(await readCartCookie(), [{ p: "p2", q: 2 }]);
});

test("removing the last line writes an empty cart the server can read", async () => {
  document.cookie = `cjp_cart_v2=${encodeURIComponent(JSON.stringify([{ p: "p1", q: 4 }]))}; Path=/`;
  const store = createCartStore();
  store.getState().hydrate(sampleCart());
  store.getState().remove("p1");
  assert.equal(store.getState().cart.isEmpty, true);
  assert.deepEqual(await readCartCookie(), []);
});

test("removing a line keeps the focus in the cart and the status region says what changed", async () => {
  const base = sampleCart();
  const cart = calculateCart(
    [
      base.lines[0],
      { ...base.lines[0], variantId: "p2", title: "Шлейка", sku: "MYW-00009", quantity: 1 },
    ],
    { freeShippingThreshold: 150000, minOrderAmount: null },
  );
  const heading = document.createElement("h1");
  heading.id = "cart-title";
  heading.tabIndex = -1;
  document.body.append(heading);
  render(
    React.createElement(
      CartStoreProvider,
      null,
      React.createElement(CartClient, { initialCart: cart }),
    ),
  );
  const first = screen.getByRole("button", { name: "Видалити Бальзам для лапок" });
  first.focus();
  fireEvent.click(first);
  assert.equal(
    document.activeElement,
    screen.getByRole("button", { name: "Видалити Шлейка" }),
  );
  assert.match(screen.getByRole("status").textContent, /«Бальзам для лапок» видалено з кошика\. Разом за товари: 320\s?₴\./);
  fireEvent.click(screen.getByRole("button", { name: "Збільшити кількість: Шлейка" }));
  assert.match(screen.getByRole("status").textContent, /Кількість «Шлейка»: 2/);
  fireEvent.click(screen.getByRole("button", { name: "Видалити Шлейка" }));
  assert.equal(document.activeElement, heading);
  assert.match(screen.getByRole("status").textContent, /Кошик порожній\./);
  heading.remove();
});
