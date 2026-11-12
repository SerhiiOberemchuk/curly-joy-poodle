const assert = require("node:assert/strict");
const { test, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/catalog" });
for (const name of ["window", "document", "HTMLElement", "Element", "Node", "MutationObserver", "location", "history", "navigator"]) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};

const React = require("react");
const { render, screen, cleanup, waitFor } = require("@testing-library/react");
const userEvent = require("@testing-library/user-event").default;
const { NuqsTestingAdapter } = require("nuqs/adapters/testing");

const load = createLoader({
  "next/navigation": { useSearchParams: () => new URLSearchParams() },
  "@/features/catalog/components/product-grid": {
    ProductGrid: ({ products, emptyMessage }) => products.length
      ? React.createElement("ul", { "aria-label": "Результати" }, products.map((product) => React.createElement("li", { key: product.id }, product.title)))
      : React.createElement("p", null, emptyMessage),
    ProductGridSkeleton: () => null,
  },
});
const { CatalogFilterControls, CatalogResults } = load("src/features/catalog/components/catalog-results.tsx");
const { filterFacets } = load("src/features/catalog/filtering.ts");
const products = Array.from({ length: 72 }, (_, index) => ({
  id: `p${index + 1}`,
  title: `Товар ${index + 1}`,
  brand: index % 2 ? "B" : "A",
  priceFrom: (index + 1) * 100,
  inStock: true,
  options: [],
}));

afterEach(cleanup);

test("separate filter and result regions share URL state and reset show-more after a filter change", async () => {
  const user = userEvent.setup({ document });
  const updates = [];
  render(React.createElement(NuqsTestingAdapter, {
    searchParams: "?page=3",
    hasMemory: true,
    onUrlUpdate: (event) => updates.push(event.searchParams),
  },
  React.createElement(CatalogFilterControls, { facets: filterFacets(products) }),
  React.createElement(CatalogResults, { products })));

  assert.equal(screen.getByRole("list", { name: "Результати" }).children.length, 24);
  assert.ok(screen.getByText("Товар 49", { exact: true }));
  await user.click(screen.getByRole("checkbox", { name: /A/ }));
  await waitFor(() => assert.equal(updates.at(-1)?.get("brand"), "A"));
  assert.equal(updates.at(-1).get("page"), null);
  assert.ok(screen.getByText("Товар 1", { exact: true }));
  assert.equal(screen.getByRole("list", { name: "Результати" }).children.length, 24);

  await user.click(screen.getByRole("button", { name: "Показати ще 12", exact: true }));
  await waitFor(() => assert.equal(screen.getByRole("list", { name: "Результати" }).children.length, 36));
  assert.ok(screen.getByText("Товар 1", { exact: true }));
  assert.ok(screen.getByText("Товар 71", { exact: true }));

  await user.click(screen.getByRole("button", { name: "Скинути фільтри", exact: true }));
  await waitFor(() => assert.equal(updates.at(-1).get("brand"), null));
  assert.equal(screen.getByRole("list", { name: "Результати" }).children.length, 24);
  assert.ok(screen.getByText("Товар 1", { exact: true }));
});
