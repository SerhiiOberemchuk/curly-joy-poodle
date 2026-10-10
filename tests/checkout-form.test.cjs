const assert = require("node:assert/strict");
const { test, beforeEach, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/checkout",
});
for (const name of [
  "window",
  "document",
  "HTMLElement",
  "Element",
  "Node",
  "MutationObserver",
  "getComputedStyle",
  "FormData",
]) {
  globalThis[name] =
    typeof dom.window[name] === "function" && name === "getComputedStyle"
      ? dom.window[name].bind(dom.window)
      : dom.window[name];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
  act,
} = require("@testing-library/react");
const userEvent = require("@testing-library/user-event").default;
const { SWRConfig } = require("swr");
const { createLoader } = require("./load-modules.cjs");
const CITY = {
  ref: "8d5a980d-391c-11dd-90d9-001a92567626",
  settlementRef: "8d5a980d-391c-11dd-90d9-001a92567627",
  label: "м. Рівне, Рівненська обл.",
};
const OTHER_CITY = {
  ...CITY,
  ref: "8d5a980d-391c-11dd-90d9-001a92567628",
  label: "м. Луцьк, Волинська обл.",
};
const BRANCH = {
  ref: "1ec09d88-e1c2-11e3-8c4a-0050568002cf",
  number: "5",
  label: "Відділення №5: вул. Київська, 40",
};
const OTHER_BRANCH = {
  ...BRANCH,
  ref: "1ec09d88-e1c2-11e3-8c4a-0050568002cc",
  number: "15",
  label: "Відділення №15: вул. Соборна, 12",
};
const STREET = {
  ref: "1ec09d88-e1c2-11e3-8c4a-0050568002cd",
  label: "вул. Київська",
};
let submissions,
  failWarehouses,
  cityQueries,
  streetQueries,
  warehouseCities,
  response;
let statusChecks;
const load = createLoader({
  "next/link": {
    __esModule: true,
    default: ({ children, href }) =>
      React.createElement("a", { href }, children),
  },
  "@/features/checkout/actions": {
    checkPaymentStatusAction: async () => {
      statusChecks++;
    },
    placeOrderAction: async (_state, data) => {
      submissions.push(Object.fromEntries(data));
      return response;
    },
  },
  "@/features/checkout/nova-poshta.actions": {
    searchCitiesAction: async (query) => {
      cityQueries.push(query);
      return { ok: true, data: query.startsWith("Лу") ? [OTHER_CITY] : [CITY] };
    },
    listWarehousesAction: async (cityRef) => {
      warehouseCities.push(cityRef);
      return failWarehouses
        ? { ok: false, error: "Довідник недоступний" }
        : { ok: true, data: [BRANCH, OTHER_BRANCH] };
    },
    searchStreetsAction: async (cityRef, query) => {
      streetQueries.push({ cityRef, query });
      return { ok: true, data: [STREET] };
    },
  },
});
const { CheckoutForm } = load(
  "src/features/checkout/components/checkout-form.tsx",
);
const capabilities = {
  cart: {
    currency: "UAH",
    freeShippingThreshold: null,
    minOrderAmount: null,
    byCurrency: [],
  },
  payments: [
    { key: "monobank", status: "active", paymentLink: true },
    { key: "cod", status: "active" },
  ],
  shipping: [
    { key: "nova_poshta", status: "active", modes: ["warehouse", "doors"] },
  ],
};
beforeEach(() => {
  statusChecks = 0;
  submissions = [];
  cityQueries = [];
  streetQueries = [];
  warehouseCities = [];
  failWarehouses = false;
  response = { status: "idle", errors: {}, message: "" };
});
afterEach(cleanup);
function setup() {
  const user = userEvent.setup({ document: dom.window.document });
  render(
    React.createElement(
      SWRConfig,
      { value: { provider: () => new Map(), dedupingInterval: 0 } },
      React.createElement(CheckoutForm, {
        total: 2220,
        capabilities,
        checkoutToken: "test-token",
      }),
    ),
  );
  return user;
}
async function selectCity(user, name = "Рівне", option = CITY) {
  const city = screen.getByRole("combobox", { name: "Населений пункт" });
  await user.clear(city);
  await user.type(city, name);
  await user.click(await screen.findByRole("option", { name: option.label }));
}
async function contacts(user) {
  await user.type(screen.getByRole("textbox", { name: "Ім’я" }), "Олена");
  await user.type(screen.getByRole("textbox", { name: "Прізвище" }), "Тестова");
  await user.type(
    screen.getByRole("textbox", { name: "Телефон" }),
    "+380 67 123 45 67",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Email" }),
    "olena@example.com",
  );
}
async function selectBranch(user) {
  const branch = await screen.findByRole("combobox", {
    name: "Пункт отримання",
  });
  await waitFor(() => assert.equal(branch.disabled, false));
  await user.type(branch, "5");
  await user.keyboard("{ArrowDown}{Enter}");
}

test("one branch field searches by exact number, submits its CRM reference and supports keyboard selection", async () => {
  const user = setup();
  await contacts(user);
  await selectCity(user);
  const branch = await screen.findByRole("combobox", {
    name: "Пункт отримання",
  });
  await waitFor(() => assert.equal(branch.disabled, false));
  assert.equal(
    screen.queryByRole("textbox", { name: "Пошук відділення або поштомату" }),
    null,
  );
  await user.type(branch, "5");
  assert.equal(screen.getAllByRole("option").length, 1);
  assert.equal(screen.getByRole("option").textContent, BRANCH.label);
  await user.keyboard("{ArrowDown}{Enter}");
  await user.click(screen.getByRole("button", { name: /Перейти до оплати/ }));
  await waitFor(() => assert.equal(submissions.length, 1));
  assert.equal(submissions[0].branchRef, BRANCH.ref);
  assert.equal(submissions[0].cityRef, CITY.ref);
  assert.equal(submissions[0].citySearch, "Рівне");
  assert.equal(submissions[0].destination, BRANCH.label);
  assert.equal(submissions[0].phone, "+380671234567");
});

test("changing city clears the old branch and refreshes the directory for the new city", async () => {
  const user = setup();
  await contacts(user);
  await selectCity(user);
  await selectBranch(user);
  await selectCity(user, "Луцьк", OTHER_CITY);
  await user.click(screen.getByRole("button", { name: /Перейти до оплати/ }));
  assert.equal(submissions.length, 0);
  assert.ok(
    await screen.findByText("Оберіть відділення або поштомат зі списку"),
  );
  assert.equal(warehouseCities.at(-1), OTHER_CITY.ref);
  assert.equal(
    document.activeElement,
    screen.getByRole("combobox", { name: "Пункт отримання" }),
  );
});

test("courier keeps the city, requires a CRM street and building, and switching back removes the courier address", async () => {
  const user = setup();
  await contacts(user);
  await selectCity(user);
  await selectBranch(user);
  await user.click(screen.getByRole("radio", { name: /Кур’єр Нової пошти/ }));
  assert.ok(screen.getByText(CITY.label));
  const street = screen.getByRole("combobox", { name: "Вулиця" });
  await user.type(street, "Київ");
  await user.click(await screen.findByRole("option", { name: STREET.label }));
  await user.click(screen.getByRole("button", { name: /Перейти до оплати/ }));
  assert.equal(submissions.length, 0);
  assert.ok(await screen.findByText("Вкажіть номер будинку"));
  await user.type(screen.getByRole("textbox", { name: "Будинок" }), "12А");
  await user.type(
    screen.getByRole("textbox", { name: "Квартира — необов’язково" }),
    "7",
  );
  await user.click(screen.getByRole("radio", { name: /Накладений платіж/ }));
  await user.click(
    screen.getByRole("button", { name: /Підтвердити замовлення/ }),
  );
  await waitFor(() => assert.equal(submissions.length, 1));
  assert.equal(submissions[0].streetRef, STREET.ref);
  assert.equal(submissions[0].streetSearch, "Київ");
  assert.equal(submissions[0].branchRef, "");
  assert.equal(submissions[0].building, "12А");
  assert.equal(streetQueries.at(-1).cityRef, CITY.ref);
  await user.click(
    screen.getByRole("radio", { name: /Відділення або поштомат Нової пошти/ }),
  );
  await selectBranch(user);
  await user.click(
    screen.getByRole("button", { name: /Підтвердити замовлення/ }),
  );
  await waitFor(() => assert.equal(submissions.length, 2));
  assert.equal(submissions[1].streetRef, "");
  assert.equal(submissions[1].streetSearch, "");
  assert.equal(submissions[1].building, "");
  assert.equal(submissions[1].flat, "");
});

test("directory errors offer a working retry without submitting an invented branch", async () => {
  failWarehouses = true;
  const user = setup();
  await selectCity(user);
  assert.ok(await screen.findByText("Довідник недоступний"));
  const retry = screen.getByRole("button", { name: "Спробувати ще раз" });
  assert.equal(retry.disabled, false);
  failWarehouses = false;
  await user.click(retry);
  await waitFor(() =>
    assert.equal(screen.queryByText("Довідник недоступний"), null),
  );
  await selectBranch(user);
  assert.ok(screen.getByText(BRANCH.label));
  assert.equal(submissions.length, 0);
});

test("server branch errors focus the searchable field and disappear after correcting the selection", async () => {
  response = {
    status: "error",
    message: "Перевірте адресу",
    errors: { branchRef: "Цей пункт отримання недоступний" },
  };
  const user = setup();
  await contacts(user);
  await selectCity(user);
  await selectBranch(user);
  await user.click(screen.getByRole("button", { name: /Перейти до оплати/ }));
  assert.ok(await screen.findByText("Цей пункт отримання недоступний"));
  const branch = screen.getByRole("combobox", { name: "Пункт отримання" });
  await waitFor(() => assert.equal(document.activeElement, branch));
  await user.type(branch, "15");
  await user.click(screen.getByRole("option", { name: OTHER_BRANCH.label }));
  await waitFor(() =>
    assert.equal(screen.queryByText("Цей пункт отримання недоступний"), null),
  );
  assert.equal(screen.queryByText("Перевірте адресу"), null);
});

test("branch search also finds an address and reports no matches in the same control", async () => {
  const user = setup();
  await selectCity(user);
  const branch = await screen.findByRole("combobox", {
    name: "Пункт отримання",
  });
  await waitFor(() => assert.equal(branch.disabled, false));
  await user.type(branch, "999");
  assert.ok(
    screen.getByText("Нічого не знайдено. Перевірте номер або адресу."),
  );
  await user.clear(branch);
  await user.type(branch, "Соборна");
  assert.equal(screen.getAllByRole("option").length, 1);
  await user.click(screen.getByRole("option", { name: OTHER_BRANCH.label }));
  assert.ok(screen.getByText(OTHER_BRANCH.label));
});

test("pending submission disables all address controls and prevents a second order submission", async () => {
  let complete;
  response = new Promise((resolve) => {
    complete = resolve;
  });
  const user = setup();
  await contacts(user);
  await selectCity(user);
  await selectBranch(user);
  const branch = screen.getByRole("combobox", { name: "Пункт отримання" });
  const city = screen.getByRole("combobox", { name: "Населений пункт" });
  await user.click(screen.getByRole("button", { name: /Перейти до оплати/ }));
  const button = await screen.findByRole("button", { name: "Оформлюємо…" });
  assert.equal(button.disabled, true);
  assert.equal(branch.disabled, true);
  assert.equal(city.disabled, true);
  fireEvent.click(button);
  assert.equal(submissions.length, 1);
  await act(async () => {
    complete({ status: "idle", message: "", errors: {} });
  });
  await waitFor(() =>
    assert.equal(screen.queryByRole("button", { name: "Оформлюємо…" }), null),
  );
});

test("email is trimmed and alphabetic characters cannot masquerade as a valid phone", () => {
  const { checkoutSchema, normalizePhone } = load(
    "src/features/checkout/validation.ts",
  );
  assert.equal(normalizePhone("abc0671234567"), null);
  const parsed = checkoutSchema.safeParse({
    firstName: " Олена ",
    lastName: " Тестова ",
    email: " olena@example.com ",
    phone: "0671234567",
    city: CITY.label,
    cityRef: CITY.ref,
    citySearch: "Рівне",
    branchRef: BRANCH.ref,
    destination: BRANCH.label,
    streetRef: "",
    streetSearch: "",
    building: "",
    flat: "",
    comment: "",
    delivery: "np-branch",
    payment: "card",
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.email, "olena@example.com");
  assert.equal(parsed.data.firstName, "Олена");
});

function paymentMonitor(active) {
  const { PaymentStatusPoller } = load(
    "src/features/checkout/components/payment-status-poller.tsx",
  );
  return React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    React.createElement(
      PaymentStatusPoller,
      { active, orderId: "order-1" },
      React.createElement("button", null, "Перейти до оплати"),
    ),
  );
}

test("payment monitor shows a loader, checks after five seconds and stops when confirmation arrives", async (t) => {
  t.mock.timers.enable({
    apis: ["setTimeout", "Date"],
    now: new Date("2026-10-09T12:00:00Z"),
  });
  let view;
  await act(async () => {
    view = render(paymentMonitor(true));
  });
  assert.ok(screen.getByRole("status"));
  assert.ok(screen.getByText("Перевіряємо оплату…"));
  assert.equal(
    screen.queryByRole("button", { name: "Перейти до оплати" }),
    null,
  );
  const initial = statusChecks;
  await act(async () => {
    t.mock.timers.tick(4999);
  });
  assert.equal(statusChecks, initial);
  await act(async () => {
    t.mock.timers.tick(1);
  });
  assert.equal(statusChecks, initial + 1);
  await act(async () => {
    view.rerender(paymentMonitor(false));
  });
  assert.equal(screen.queryByRole("status"), null);
  const confirmed = statusChecks;
  await act(async () => {
    t.mock.timers.tick(10000);
  });
  assert.equal(statusChecks, confirmed);
});

test("a delayed acquiring confirmation stops the loader after one minute without claiming a failed or paid result", async (t) => {
  t.mock.timers.enable({
    apis: ["setTimeout", "Date"],
    now: new Date("2026-10-09T12:00:00Z"),
  });
  await act(async () => {
    render(paymentMonitor(true));
  });
  for (let i = 0; i < 12; i++) {
    await act(async () => {
      t.mock.timers.tick(5000);
    });
  }
  assert.equal(screen.queryByText("Перевіряємо оплату…"), null);
  assert.ok(screen.getByText(/Перевірка займає більше часу/));
  assert.ok(screen.getByRole("button", { name: "Перейти до оплати" }));
  const expired = statusChecks;
  await act(async () => {
    t.mock.timers.tick(15000);
  });
  assert.equal(statusChecks, expired);
});

test("checkout labels and ARIA remain valid for branch and courier controls", async () => {
  const axe = require("axe-core");
  const user = setup();
  document.documentElement.lang = "uk";
  document.title = "Оформлення замовлення";
  await selectCity(user);
  await selectBranch(user);
  const options = {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
    rules: { "color-contrast": { enabled: false } },
  };
  let result;
  await act(async () => {
    result = await axe.run(document.body, options);
  });
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
  await user.click(screen.getByRole("radio", { name: /Кур’єр Нової пошти/ }));
  await act(async () => {
    result = await axe.run(document.body, options);
  });
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
});

test("mobile menu stays closed after browser back and Escape also works on the toggle", async () => {
  let pathname = "/";
  const navLoad = createLoader({
    "next/navigation": { usePathname: () => pathname },
    "next/link": {
      __esModule: true,
      default: ({ children, ...props }) =>
        React.createElement("a", props, children),
    },
  });
  const { MobileNav } = navLoad("src/components/layout/mobile-nav.tsx");
  const user = userEvent.setup({ document: dom.window.document });
  const element = () =>
    React.createElement(MobileNav, {
      links: [{ href: "/catalog", label: "Каталог" }],
    });
  const view = render(element());
  await user.click(screen.getByRole("button", { name: "Відкрити меню" }));
  assert.ok(screen.getByRole("navigation", { name: "Мобільне меню" }));
  pathname = "/catalog";
  view.rerender(element());
  pathname = "/";
  view.rerender(element());
  assert.equal(screen.queryByRole("navigation"), null);
  await user.click(screen.getByRole("button", { name: "Відкрити меню" }));
  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("navigation"), null);
  assert.equal(
    document.activeElement,
    screen.getByRole("button", { name: "Відкрити меню" }),
  );
});
