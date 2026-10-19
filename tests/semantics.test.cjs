const assert = require("node:assert/strict");
const { test, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
for (const name of ["HTMLElement", "Node", "MutationObserver", "Event"])
  globalThis[name] = dom.window[name];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { render, screen, cleanup, fireEvent } = require("@testing-library/react");

const load = createLoader({});
const { SortSelect } = load("src/features/catalog/components/sort-select.tsx");
const { Price } = load("src/components/ui/price.tsx");

afterEach(cleanup);

test("sorting is a native select named by its visible label", () => {
  const changes = [];
  render(
    React.createElement(SortSelect, {
      value: "featured",
      onChange: (value) => changes.push(value),
    }),
  );
  const select = screen.getByRole("combobox", { name: "Сортування" });
  assert.equal(select.tagName, "SELECT");
  fireEvent.change(select, { target: { value: "price-asc" } });
  assert.deepEqual(changes, ["price-asc"]);
});

test("a discounted price tells which amount is current and which is old", () => {
  const { container } = render(
    React.createElement(Price, { amount: 120000, compareAtAmount: 150000 }),
  );
  const old = container.querySelector("del");
  assert.ok(old);
  assert.match(old.textContent, /^Стара ціна: 1\s500\s₴$/u);
  assert.match(container.textContent, /^Ціна зі знижкою: 1\s200\s₴/u);
  cleanup();
  const plain = render(React.createElement(Price, { amount: 120000 }));
  assert.equal(plain.container.querySelector("del"), null);
  assert.doesNotMatch(plain.container.textContent, /Ціна зі знижкою/);
});

test("no buyer-facing text asks to reload the page (project rule)", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(tsx?|md)$/.test(entry.name) && /оновіт[ьи] сторінку|оновити сторінку|перезавантаж/i.test(fs.readFileSync(file, "utf8")))
        offenders.push(path.relative(process.cwd(), file));
    }
  };
  walk(path.join(__dirname, "..", "src"));
  assert.deepEqual(offenders, []);
});
