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

afterEach(() => {
  cleanup();
  document.cookie = "cjp_cart_v2=; Path=/; Max-Age=0";
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

test("removing the last line writes an empty cart the server can read", async () => {
  document.cookie = `cjp_cart_v2=${encodeURIComponent(JSON.stringify([{ p: "p1", q: 4 }]))}; Path=/`;
  const store = createCartStore();
  store.getState().hydrate(sampleCart());
  store.getState().remove("p1");
  assert.equal(store.getState().cart.isEmpty, true);
  assert.deepEqual(await readCartCookie(), []);
});
