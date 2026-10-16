const assert = require("node:assert/strict");
const { test, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/favorites",
});
for (const name of ["window", "document", "HTMLElement", "Element", "Node", "MutationObserver"]) {
  globalThis[name] = dom.window[name];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const { renderToString } = require("react-dom/server");
const { hydrateRoot } = require("react-dom/client");
const { render, screen, fireEvent, cleanup, act } = require("@testing-library/react");
const { createLoader } = require("./load-modules.cjs");
const load = createLoader({
  "next/link": {
    __esModule: true,
    default: ({ children, ...props }) => React.createElement("a", props, children),
  },
  "@/features/home/components/product-tile": {
    ProductTile: ({ product }) => React.createElement("article", null,
      product.title,
      React.createElement(FavoriteToggle, { productId: product.id, productTitle: product.title }),
    ),
  },
});
const { createFavoritesStore } = load("src/features/favorites/favorites-store.ts");
const { FAVORITES_STORAGE_KEY: KEY } = load("src/features/favorites/favorites-storage.ts");
const { FavoritesProvider, FavoriteToggle, useFavoritesStore } = load("src/features/favorites/favorites.tsx");
const { FavoritesLink } = load("src/components/layout/favorites-link.tsx");
const { FavoriteProducts } = load("src/features/favorites/favorite-products.tsx");

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function memoryStorage(initial = null) {
  let value = initial;
  let writes = 0;
  let failWrite = false;
  return {
    getItem: () => value,
    setItem: (_name, next) => {
      if (failWrite) throw new Error("QuotaExceededError");
      value = next;
      writes++;
    },
    removeItem: () => { value = null; },
    get writes() { return writes; },
    set failWrite(next) { failWrite = next; },
  };
}

test("SSR initialization never reads browser storage or accepts edits before hydration", () => {
  const store = createFavoritesStore(() => { throw new Error("No browser"); });
  assert.deepEqual(store.getState().ids, []);
  assert.equal(store.getState().isHydrated, false);
  store.getState().toggle("p1");
  assert.deepEqual(store.getState().ids, []);
});

test("legacy favorites survive migration, keep order and reject duplicate or invalid IDs", async () => {
  const storage = memoryStorage(JSON.stringify(["p2", null, "p1", "p2", 42, "", "  "]));
  const store = createFavoritesStore(() => storage);
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().ids, ["p2", "p1"]);
  assert.equal(storage.writes, 0);
  store.getState().toggle("p3");
  assert.deepEqual(JSON.parse(storage.getItem(KEY)), {
    state: { ids: ["p2", "p1", "p3"] }, version: 1,
  });
  assert.equal(storage.writes, 1);
});

test("rapid toggles use current state and persisted favorites survive a new store", async () => {
  const storage = memoryStorage();
  const store = createFavoritesStore(() => storage);
  await store.persist.rehydrate();
  const toggle = store.getState().toggle;
  toggle("p1");
  toggle("p2");
  toggle("p1");
  toggle("p3");
  toggle("");
  const restored = createFavoritesStore(() => storage);
  await restored.persist.rehydrate();
  assert.deepEqual(restored.getState().ids, ["p2", "p3"]);
  assert.equal(storage.writes, 4);
  assert.equal(restored.getState().storageError, null);
  assert.equal(createFavoritesStore(() => storage).getState().ids.length, 0);
});

test("corrupt or unsupported stored data is reported without crashing or silently overwriting it", async () => {
  for (const value of ["{broken", '{"state":{"ids":["p1"]},"version":999}', '{"ids":["p1"]}']) {
    const storage = memoryStorage(value);
    const store = createFavoritesStore(() => storage);
    await store.persist.rehydrate();
    assert.equal(store.getState().isHydrated, true);
    assert.ok(store.getState().storageError);
    assert.equal(storage.getItem(KEY), value);
    assert.equal(storage.writes, 0);
    store.getState().toggle("p2");
    assert.deepEqual(store.getState().ids, ["p2"]);
    assert.equal(store.getState().storageError, null);
  }
});

test("blocked storage keeps edits in memory; a later successful save clears the error", async () => {
  const storage = memoryStorage();
  const store = createFavoritesStore(() => storage);
  await store.persist.rehydrate();
  storage.failWrite = true;
  store.getState().toggle("p1");
  store.getState().toggle("p2");
  assert.deepEqual(store.getState().ids, ["p1", "p2"]);
  assert.match(store.getState().storageError, /лише в цій вкладці/);
  assert.equal(storage.writes, 0);
  storage.failWrite = false;
  store.getState().toggle("p3");
  assert.equal(store.getState().storageError, null);
  assert.deepEqual(JSON.parse(storage.getItem(KEY)).state.ids, ["p1", "p2", "p3"]);
  assert.equal(storage.writes, 1);
});

test("denied localStorage access still allows session-only favorites", async () => {
  const store = createFavoritesStore(() => { throw new Error("SecurityError"); });
  await store.persist.rehydrate();
  assert.ok(store.getState().storageError);
  store.getState().toggle("p1");
  assert.deepEqual(store.getState().ids, ["p1"]);
  assert.match(store.getState().storageError, /лише в цій вкладці/);
});

test("heart, header count and favorites page update together without server requests", () => {
  window.localStorage.setItem(KEY, '["p1"]');
  const products = [{ id: "p1", title: "Бальзам" }, { id: "p2", title: "Шампунь" }];
  render(React.createElement(FavoritesProvider, null,
    React.createElement(FavoritesLink),
    React.createElement(FavoriteToggle, { productId: "p2", productTitle: "Шампунь" }),
    React.createElement(FavoriteProducts, { products }),
  ));
  assert.ok(screen.getByRole("link", { name: "Обране: 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Додати до обраного: Шампунь" }));
  assert.ok(screen.getByRole("link", { name: "Обране: 2" }));
  assert.equal(screen.getAllByRole("article").length, 2);
  assert.equal(screen.getAllByRole("button", { name: "Прибрати з обраного: Шампунь" })[0].getAttribute("aria-pressed"), "true");
  fireEvent.click(screen.getByRole("button", { name: "Прибрати з обраного: Бальзам" }));
  assert.ok(screen.getByRole("link", { name: "Обране: 1" }));
  assert.equal(screen.getAllByRole("article").length, 1);
  fireEvent.click(screen.getAllByRole("button", { name: "Прибрати з обраного: Шампунь" })[0]);
  assert.ok(screen.getByText(/Тут з’являться товари/));
  assert.deepEqual(JSON.parse(window.localStorage.getItem(KEY)).state.ids, []);
});

test("other tabs and localStorage.clear update the UI without write echoes; unrelated storage is ignored", () => {
  render(React.createElement(FavoritesProvider, null, React.createElement(FavoritesLink)));
  function storageEvent(key, storageArea = window.localStorage) {
    act(() => window.dispatchEvent(new window.StorageEvent("storage", { key, storageArea })));
  }
  window.localStorage.setItem(KEY, '["p1","p2"]');
  storageEvent("unrelated");
  storageEvent(KEY, window.sessionStorage);
  assert.ok(screen.getByRole("link", { name: "Обране: 0" }));
  storageEvent(KEY);
  assert.ok(screen.getByRole("link", { name: "Обране: 2" }));
  assert.equal(window.localStorage.getItem(KEY), '["p1","p2"]');
  window.localStorage.clear();
  storageEvent(null);
  assert.ok(screen.getByRole("link", { name: "Обране: 0" }));
  assert.equal(window.localStorage.getItem(KEY), null);
});

test("a product selector does not rerender when another favorite changes", () => {
  let renders = 0;
  function ProductObserver() {
    const selected = useFavoritesStore((state) => state.ids.includes("p1"));
    renders++;
    return React.createElement("span", null, String(selected));
  }
  render(React.createElement(FavoritesProvider, null,
    React.createElement(ProductObserver),
    React.createElement(FavoriteToggle, { productId: "p2", productTitle: "Шампунь" }),
  ));
  const before = renders;
  fireEvent.click(screen.getByRole("button", { name: /Додати до обраного/ }));
  assert.equal(renders, before);
});

test("a failed browser write keeps the heart selected and announces the persistence error once", () => {
  const prototype = Object.getPrototypeOf(window.localStorage);
  const originalSetItem = prototype.setItem;
  prototype.setItem = () => { throw new Error("QuotaExceededError"); };
  try {
    render(React.createElement(FavoritesProvider, null,
      React.createElement(FavoritesLink),
      React.createElement(FavoriteToggle, { productId: "p1", productTitle: "Бальзам" }),
    ));
    fireEvent.click(screen.getByRole("button", { name: /Додати до обраного/ }));
    assert.ok(screen.getByRole("link", { name: "Обране: 1" }));
    assert.equal(screen.getByRole("button", { name: /Прибрати з обраного/ }).getAttribute("aria-pressed"), "true");
    assert.match(screen.getByRole("status").textContent, /лише в цій вкладці/);
  } finally {
    prototype.setItem = originalSetItem;
  }
});

test("saved browser favorites hydrate server HTML without a mismatch", async () => {
  window.localStorage.setItem(KEY, '["p1"]');
  const app = React.createElement(FavoritesProvider, null,
    React.createElement(FavoritesLink),
    React.createElement(FavoriteToggle, { productId: "p1", productTitle: "Бальзам" }),
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(app);
  document.body.appendChild(container);
  assert.match(container.textContent, /^$/);
  const errors = [];
  let root;
  await act(async () => {
    root = hydrateRoot(container, app, { onRecoverableError: (error) => errors.push(error) });
  });
  assert.deepEqual(errors, []);
  assert.ok(screen.getByRole("link", { name: "Обране: 1" }));
  assert.equal(screen.getByRole("button", { name: /Прибрати з обраного/ }).getAttribute("aria-pressed"), "true");
  await act(async () => root.unmount());
  container.remove();
});
