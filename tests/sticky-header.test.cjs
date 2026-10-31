const assert = require("node:assert/strict");
const { test, beforeEach, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const name of ["window", "document", "HTMLElement", "Event", "Node"])
  globalThis[name] = dom.window[name];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const { render, screen, fireEvent, cleanup, act } = require("@testing-library/react");
const { StickyHeader } = createLoader({})("src/components/layout/sticky-header.tsx");
let observer;

beforeEach(() => {
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      const instance = {
        callback,
        observe(element) { instance.target = element; },
        disconnect() { instance.disconnected = true; },
      };
      observer = instance;
      return instance;
    }
  };
});
afterEach(() => { cleanup(); delete globalThis.IntersectionObserver; });

function header() {
  return render(React.createElement(StickyHeader, { topbar: "Good day" },
    React.createElement("input", { "aria-label": "Пошук товарів" }),
  ));
}
function visibility(isIntersecting) {
  act(() => observer.callback([{ isIntersecting }]));
}

test("compacting and expanding keep the same search field, draft and keyboard focus", () => {
  header();
  const banner = screen.getByRole("banner");
  const input = screen.getByRole("textbox", { name: "Пошук товарів" });
  input.focus();
  fireEvent.change(input, { target: { value: "шампунь" } });
  visibility(true);
  assert.equal(banner.dataset.sticky, "true");
  assert.equal(banner.hasAttribute("data-compact"), false);
  visibility(false);
  assert.equal(banner.dataset.compact, "true");
  visibility(true);
  assert.equal(banner.hasAttribute("data-compact"), false);
  assert.equal(screen.getByRole("textbox"), input);
  assert.equal(input.value, "шампунь");
  assert.equal(document.activeElement, input);
});

test("a restored scrolled page compacts on first observation and releases its observer on unmount", () => {
  const view = header();
  visibility(false);
  assert.equal(screen.getByRole("banner").dataset.compact, "true");
  view.unmount();
  assert.equal(observer.disconnected, true);
});

test("without IntersectionObserver the ordinary header and its controls remain usable", () => {
  delete globalThis.IntersectionObserver;
  header();
  assert.equal(screen.getByRole("banner").hasAttribute("data-sticky"), false);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "пуходірка" } });
  assert.equal(input.value, "пуходірка");
});
