const assert = require("node:assert/strict");
const { test, beforeEach, mock } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/checkout",
});
globalThis.window = dom.window;

const { tabCheckoutToken, forgetCheckoutToken } = createLoader({})(
  "src/features/checkout/checkout-token.client.ts",
);

beforeEach(() => {
  window.sessionStorage.clear();
  mock.timers.reset();
});

test("a form rendered again in the same tab keeps the first token, so a retry replays the order", () => {
  assert.equal(tabCheckoutToken("first"), "first");
  assert.equal(tabCheckoutToken("rendered-after-error"), "first");
});

test("the confirmation page or a refused token starts the next checkout with a new token", () => {
  tabCheckoutToken("first");
  forgetCheckoutToken();
  assert.equal(tabCheckoutToken("second"), "second");
});

test("a stored token older than an hour is replaced", () => {
  mock.timers.enable({ apis: ["Date"], now: 0 });
  tabCheckoutToken("first");
  mock.timers.tick(60 * 60 * 1000);
  assert.equal(tabCheckoutToken("fresh"), "fresh");
  mock.timers.reset();
});

test("blocked or corrupt storage falls back to the rendered token", () => {
  window.sessionStorage.setItem("cjp-checkout-token", "{broken");
  assert.equal(tabCheckoutToken("rendered"), "rendered");
  const getItem = mock.method(window.sessionStorage.__proto__, "getItem", () => {
    throw new Error("blocked");
  });
  assert.equal(tabCheckoutToken("other"), "other");
  getItem.mock.restore();
});
