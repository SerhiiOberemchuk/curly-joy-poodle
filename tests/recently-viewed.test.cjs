const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-modules.cjs");

let products = [];
let reads = 0;
const load = createLoader({
  "server-only": {},
  "@/features/catalog/queries": { getProducts: async () => { reads++; return products; } },
});
const { createViewedProductsStore } = load("src/features/recently-viewed/store.ts");
const { VIEWED_PRODUCTS_KEY } = load("src/features/recently-viewed/contract.ts");
const { getViewedProductsAction } = load("src/features/recently-viewed/actions.ts");

function memoryStorage(initial) {
  const entries = new Map(initial ? [[VIEWED_PRODUCTS_KEY, initial]] : []);
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

test("viewing history waits for hydration, deduplicates, moves a revisit first and keeps only 12 IDs", async () => {
  const storage = memoryStorage();
  const store = createViewedProductsStore(() => storage);
  store.getState().remember("not-hydrated");
  assert.deepEqual(store.getState().ids, []);
  await store.persist.rehydrate();
  for (let i = 0; i < 16; i++) store.getState().remember(`p${i}`);
  store.getState().remember("p10");
  assert.equal(store.getState().ids.length, 12);
  assert.equal(store.getState().ids[0], "p10");
  assert.equal(new Set(store.getState().ids).size, 12);
  assert.equal(store.getState().ids.includes("p3"), false);
  const saved = JSON.parse(storage.getItem(VIEWED_PRODUCTS_KEY));
  assert.deepEqual(Object.keys(saved.state), ["ids"]);
  const restored = createViewedProductsStore(() => storage);
  await restored.persist.rehydrate();
  assert.deepEqual(restored.getState().ids, store.getState().ids);
  restored.getState().clear();
  assert.deepEqual(restored.getState().ids, []);
  assert.deepEqual(JSON.parse(storage.getItem(VIEWED_PRODUCTS_KEY)).state.ids, []);
});

test("malformed or blocked browser storage does not stop this visit's history or clearing it", async () => {
  for (const initial of ["not JSON", JSON.stringify({ state: { ids: [42] }, version: 1 })]) {
    const store = createViewedProductsStore(() => memoryStorage(initial));
    await store.persist.rehydrate();
    assert.equal(store.getState().isHydrated, true);
    assert.deepEqual(store.getState().ids, []);
  }
  const blocked = createViewedProductsStore(() => { throw new Error("storage denied"); });
  await blocked.persist.rehydrate();
  blocked.getState().remember("p1");
  assert.deepEqual(blocked.getState().ids, ["p1"]);
  blocked.getState().clear();
  assert.deepEqual(blocked.getState().ids, []);
});

test("history resolves current catalog data in visit order and drops unpublished products", async () => {
  products = [{ id: "a", priceFrom: 100, inStock: true }, { id: "b", priceFrom: 200, inStock: false }];
  const result = await getViewedProductsAction(["b", "removed", "a", "b"]);
  assert.deepEqual(result, { ok: true, items: [products[1], products[0]] });
  products = [{ ...products[0], priceFrom: 350, inStock: false }];
  assert.deepEqual(await getViewedProductsAction(["a"]), { ok: true, items: products });
});

test("invalid and empty history never trigger a catalog read", async () => {
  reads = 0;
  assert.deepEqual(await getViewedProductsAction([" "]), { ok: false });
  assert.deepEqual(await getViewedProductsAction(Array.from({ length: 13 }, (_, i) => `p${i}`)), { ok: false });
  assert.deepEqual(await getViewedProductsAction([]), { ok: true, items: [] });
  assert.equal(reads, 0);
});
