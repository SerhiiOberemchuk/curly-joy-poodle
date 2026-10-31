const assert = require("node:assert/strict");
const { test, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
for (const name of ["HTMLElement", "Element", "Node", "MutationObserver", "Event"])
  globalThis[name] = dom.window[name];
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { render, screen, cleanup } = require("@testing-library/react");
const userEvent = require("@testing-library/user-event").default;

const load = createLoader({});
const { SortSelect } = load("src/features/catalog/components/sort-select.tsx");
const { Price } = load("src/components/ui/price.tsx");
const { ChoiceSelect } = load("src/components/ui/choice-select.tsx");

afterEach(cleanup);

test("sorting keeps its label and supports keyboard selection and Escape", async () => {
  const changes = [];
  const user = userEvent.setup({ document });
  render(
    React.createElement(SortSelect, {
      value: "featured",
      onChange: (value) => changes.push(value),
    }),
  );
  const select = screen.getByRole("combobox", { name: "Сортування" });
  await user.click(select);
  assert.ok(screen.getByRole("listbox"));
  await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
  assert.deepEqual(changes, ["price-asc"]);
  assert.equal(screen.queryByRole("listbox"), null);
  await user.click(select);
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("listbox"), null);
  assert.equal(document.activeElement, select);
});

test("a named choice submits its default and updated value in native FormData", async () => {
  const user = userEvent.setup({ document });
  const { container } = render(React.createElement("form", null,
    React.createElement(ChoiceSelect, {
      label: "Тип бізнесу", name: "businessType", defaultValue: "shop",
      options: [{ value: "shop", label: "Зоомагазин" }, { value: "groom", label: "Грумінг-салон" }],
    }),
  ));
  const form = container.querySelector("form");
  assert.equal(new dom.window.FormData(form).get("businessType"), "shop");
  await user.click(screen.getByRole("combobox", { name: "Тип бізнесу" }));
  await user.click(screen.getByRole("option", { name: "Грумінг-салон" }));
  assert.equal(new dom.window.FormData(form).get("businessType"), "groom");
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
