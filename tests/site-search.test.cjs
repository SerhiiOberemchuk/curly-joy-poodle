const assert = require("node:assert/strict");
const { test, beforeEach, afterEach, mock } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
for (const name of ["window", "document", "HTMLElement", "HTMLInputElement", "Event", "Node"])
  globalThis[name] = dom.window[name];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const { render, screen, fireEvent, cleanup, act } = require("@testing-library/react");
let pathname, params, submissions;
const load = createLoader({
  "next/navigation": {
    usePathname: () => pathname,
    useSearchParams: () => params,
  },
  "next/form": {
    __esModule: true,
    default: ({ action, replace, scroll, onSubmit, children, ...props }) =>
      React.createElement("form", {
        ...props,
        action,
        onSubmit: (event) => {
          onSubmit?.(event);
          event.preventDefault();
          submissions.push({
            query: new dom.window.FormData(event.currentTarget).get("q"),
            replace,
            scroll,
          });
        },
      }, children),
  },
});
const { SiteSearch } = load("src/components/layout/site-search.tsx");
const tick = (ms) => act(() => mock.timers.tick(ms));
const change = (input, value) => fireEvent.change(input, { target: { value } });

beforeEach(() => {
  pathname = "/";
  params = new URLSearchParams();
  submissions = [];
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
});
afterEach(() => {
  cleanup();
  mock.timers.reset();
});

test("header search waits for two trimmed characters and a 400 ms pause", () => {
  render(React.createElement(SiteSearch));
  const input = screen.getByRole("searchbox", { name: "Пошук товарів" });
  change(input, " п ");
  tick(500);
  assert.equal(submissions.length, 0);
  change(input, "пу");
  tick(399);
  assert.equal(submissions.length, 0);
  tick(1);
  assert.deepEqual(submissions, [{ query: "пу", replace: false, scroll: false }]);
  assert.equal(input.form.getAttribute("action"), "/catalog");
});

test("continued typing sends only the last value and shortening cancels a pending search", () => {
  render(React.createElement(SiteSearch));
  const input = screen.getByRole("searchbox");
  change(input, "пу");
  tick(300);
  change(input, "пуходірка");
  tick(399);
  assert.equal(submissions.length, 0);
  tick(1);
  assert.equal(submissions[0].query, "пуходірка");
  change(input, "парфуми");
  change(input, "п");
  tick(500);
  assert.equal(submissions.length, 1);
});

test("manual submission stays immediate and cancels the pending automatic submission", () => {
  render(React.createElement(SiteSearch));
  const input = screen.getByRole("searchbox");
  change(input, "пуходірка");
  tick(100);
  fireEvent.submit(input.form);
  assert.equal(submissions.length, 1);
  tick(500);
  assert.equal(submissions.length, 1);
});

test("clearing catalog search restores all products without adding history entries", () => {
  pathname = "/catalog";
  render(React.createElement(SiteSearch));
  const input = screen.getByRole("searchbox");
  change(input, "пу");
  tick(400);
  change(input, "");
  tick(400);
  assert.deepEqual(submissions, [
    { query: "пу", replace: true, scroll: false },
    { query: "", replace: true, scroll: false },
  ]);
});

test("clearing a draft outside the catalog does not navigate", () => {
  render(React.createElement(SiteSearch));
  const input = screen.getByRole("searchbox");
  change(input, "пу");
  change(input, "");
  tick(500);
  assert.equal(submissions.length, 0);
});

test("IME composition waits until the complete text is committed", () => {
  render(React.createElement(SiteSearch));
  const input = screen.getByRole("searchbox");
  fireEvent.compositionStart(input);
  change(input, "пу");
  tick(500);
  assert.equal(submissions.length, 0);
  fireEvent.compositionEnd(input);
  tick(400);
  assert.equal(submissions[0].query, "пу");
});

test("leaving the search, changing page or unmounting cancels a pending search", () => {
  const view = render(React.createElement(SiteSearch));
  const input = screen.getByRole("searchbox");
  change(input, "пу");
  fireEvent.blur(input, { relatedTarget: document.body });
  tick(500);
  assert.equal(submissions.length, 0);
  change(input, "парфуми");
  pathname = "/business";
  view.rerender(React.createElement(SiteSearch));
  tick(500);
  assert.equal(submissions.length, 0);
  change(input, "пуходірка");
  view.unmount();
  tick(500);
  assert.equal(submissions.length, 0);
});

test("direct URLs seed the field, active drafts survive responses, and navigation clears a blurred field", () => {
  pathname = "/catalog";
  params = new URLSearchParams({ q: "пуходірка" });
  const view = render(React.createElement(SiteSearch));
  const input = screen.getByRole("searchbox");
  assert.equal(input.value, "пуходірка");
  act(() => input.focus());
  change(input, "парфуми");
  params = new URLSearchParams({ q: "пар" });
  view.rerender(React.createElement(SiteSearch));
  assert.equal(input.value, "парфуми");
  act(() => input.blur());
  params = new URLSearchParams();
  view.rerender(React.createElement(SiteSearch));
  assert.equal(input.value, "");
  act(() => input.focus());
  change(input, "пуходірка");
  pathname = "/";
  view.rerender(React.createElement(SiteSearch));
  assert.equal(input.value, "");
});
