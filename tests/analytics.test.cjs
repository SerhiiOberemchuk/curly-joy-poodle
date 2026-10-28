const assert = require("node:assert/strict");
const { test, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

// Clarity inserts its tag before the page's first script, as in a real document.
const dom = new JSDOM("<!doctype html><html><head><script></script></head><body></body></html>", {
  url: "http://localhost",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { render, screen, cleanup } = require("@testing-library/react");

const load = createLoader({
  "next/link": {
    __esModule: true,
    default: ({ children, href }) =>
      React.createElement("a", { href, "data-client-navigation": "" }, children),
  },
  "@/components/ui/button": { buttonStyles: () => "button" },
});
const { ClarityAnalytics } = load("src/components/analytics/clarity-analytics.tsx");
const { CartSummary } = load("src/features/cart/components/cart-summary.tsx");

function clarityTag() {
  return document.getElementById("clarity-script");
}

function mountAt(url) {
  dom.reconfigure({ url: `http://localhost${url}` });
  render(React.createElement(ClarityAnalytics));
}

afterEach(() => {
  cleanup();
  clarityTag()?.remove();
  delete window.clarity;
});

test("a storefront page loads the shop's Clarity project", () => {
  mountAt("/catalog?sort=price");
  assert.equal(
    clarityTag()?.getAttribute("src"),
    "https://www.clarity.ms/tag/z4ho5gc47t?ref=npm",
  );
  assert.equal(typeof window.clarity, "function");
});

test("a document opened on checkout never loads Clarity, so the order token is not recorded", () => {
  for (const url of ["/checkout", "/checkout/success?token=secret"]) {
    mountAt(url);
    assert.equal(clarityTag(), null, url);
    assert.equal(window.clarity, undefined, url);
    cleanup();
  }
});

test("the cart opens checkout as a new document, out of a recorded one", () => {
  const cart = {
    itemCount: 1,
    subtotal: 32000,
    savings: 0,
    freeShipping: false,
    freeShippingThreshold: null,
    minOrderAmount: null,
    minOrderRemainder: null,
  };
  render(React.createElement(CartSummary, { cart }));
  const link = screen.getByRole("link", { name: "Оформити замовлення" });
  assert.equal(link.getAttribute("href"), "/checkout");
  assert.equal(link.hasAttribute("data-client-navigation"), false);
});
