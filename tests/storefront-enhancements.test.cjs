const assert = require("node:assert/strict");
const { test, afterEach } = require("node:test");
const { JSDOM } = require("jsdom");
const { createLoader } = require("./load-modules.cjs");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
for (const name of [
  "HTMLElement",
  "HTMLInputElement",
  "HTMLFormElement",
  "MutationObserver",
  "FormData",
  "Event",
  "MouseEvent",
])
  globalThis[name] = dom.window[name];
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

let products = [{ id: "group:model" }];
let catalogFailure = false;
let crmFailure = null;
let crmResponse = { data: { id: "lead-1" } };
let requests = [];
class CrmApiError extends Error {
  constructor(status) {
    super("CRM unavailable");
    this.status = status;
  }
}
const load = createLoader({
  "server-only": {},
  "@/features/catalog/queries": {
    getListedProducts: async () => {
      if (catalogFailure) throw new Error("Unavailable");
      return products;
    },
  },
  "@/lib/crm-client": {
    CrmApiError,
    crmRequest: async (path, body) => {
      requests.push({ path, body });
      if (crmFailure) throw crmFailure;
      return crmResponse;
    },
  },
});
const { previewReviewAction } = load("src/features/reviews/actions.ts");
const { initialReviewState } = load("src/features/reviews/action-state.ts");
const { ReviewForm } = load("src/features/reviews/components/review-form.tsx");
const { videoSource } = load("src/features/catalog/video.ts");
const { reviewSummary } = load("src/features/reviews/demo.ts");
const { getWelcomeOffer, submitOfferRequest } = load(
  "src/features/welcome-offer/offer.server.ts",
);
const previousEnv = Object.fromEntries(
  [
    "WELCOME_OFFER_ENABLED",
    "WELCOME_OFFER_DESCRIPTION",
    "WELCOME_OFFER_TITLE",
    "OBRIYM_CRM_API_KEY",
  ].map((key) => [key, process.env[key]]),
);

afterEach(() => {
  cleanup();
  products = [{ id: "group:model" }];
  catalogFailure = false;
  crmFailure = null;
  crmResponse = { data: { id: "lead-1" } };
  requests = [];
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function reviewData(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    name: "Марія",
    email: "maria@example.com",
    rating: "5",
    comment: "Приємна річ для щоденних прогулянок.",
    consent: "on",
    ...overrides,
  }))
    data.set(key, value);
  return data;
}
function enableOffer() {
  process.env.WELCOME_OFFER_ENABLED = "true";
  process.env.WELCOME_OFFER_DESCRIPTION = "Узгоджені умови пропозиції";
  process.env.OBRIYM_CRM_API_KEY = "test-only-key";
}
function offerData(overrides = {}) {
  const data = new FormData();
  data.set("offerId", getWelcomeOffer()?.id ?? "");
  for (const [key, value] of Object.entries({
    email: "maria@example.com",
    phone: "",
    consent: "on",
    ...overrides,
  }))
    data.set(key, value);
  return data;
}

test("review preview validates all fields on the server and preserves corrections", async () => {
  const state = await previewReviewAction(
    "group:model",
    initialReviewState,
    reviewData({
      name: "М",
      email: "broken",
      rating: "6",
      comment: "Коротко",
      consent: "",
    }),
  );
  assert.equal(state.status, "error");
  assert.deepEqual(Object.keys(state.errors).sort(), [
    "comment",
    "consent",
    "email",
    "name",
    "rating",
  ]);
  assert.equal(state.values.comment, "Коротко");
  assert.equal(requests.length, 0);
});
test("review preview does not publish, store email or create a CRM lead", async () => {
  const state = await previewReviewAction(
    "group:model",
    initialReviewState,
    reviewData(),
  );
  assert.equal(state.status, "preview");
  assert.deepEqual(state.preview, {
    author: "Марія",
    rating: 5,
    text: "Приємна річ для щоденних прогулянок.",
  });
  assert.equal(state.preview.email, undefined);
  assert.equal(requests.length, 0);
  assert.match(state.message, /не збережений/);
});
test("review preview refuses missing or unavailable CRM products", async () => {
  products = [];
  assert.equal(
    (await previewReviewAction("group:model", initialReviewState, reviewData()))
      .status,
    "error",
  );
  catalogFailure = true;
  const state = await previewReviewAction(
    "group:model",
    initialReviewState,
    reviewData(),
  );
  assert.equal(state.status, "error");
  assert.equal(state.values.email, "maria@example.com");
});
test("review form supports keyboard rating selection and shows only a preview", async () => {
  render(React.createElement(ReviewForm, { productId: "group:model" }));
  const user = userEvent.setup();
  const first = screen.getByRole("radio", { name: "1 з 5" });
  first.focus();
  await user.keyboard(
    "[Space][ArrowRight][ArrowRight][ArrowRight][ArrowRight]",
  );
  assert.equal(screen.getByRole("radio", { name: "5 з 5" }).checked, true);
  await user.type(screen.getByLabelText(/Ваше ім’я/), "Марія");
  await user.type(screen.getByLabelText("Email *"), "maria@example.com");
  await user.type(
    screen.getByLabelText(/Ваші враження/),
    "Приємна річ для щоденних прогулянок.",
  );
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Переглянути відгук" }));
  await waitFor(() =>
    assert.match(
      screen.getByRole("status").textContent,
      /ще не опублікований і не збережений/,
    ),
  );
  assert.equal(requests.length, 0);
});
test("favorite button on a catalog card updates the shared store without navigating", async () => {
  window.localStorage.clear();
  const { FavoritesProvider } = load("src/features/favorites/favorites.tsx");
  const cardLoad = createLoader({
    "next/link": {
      __esModule: true,
      default: ({ children, href }) =>
        React.createElement("a", { href }, children),
    },
    "@/features/favorites/favorites": load(
      "src/features/favorites/favorites.tsx",
    ),
    "@/features/catalog/components/product-artwork": {
      ProductArtwork: () => React.createElement("div"),
    },
  });
  const { ProductCard } = cardLoad(
    "src/features/catalog/components/product-card.tsx",
  );
  const product = {
    id: "group:model",
    title: "Шлейка",
    slug: "shleika",
    image: { src: null, alt: "" },
    brand: null,
    summary: "",
    priceFrom: 10000,
    options: [],
    inStock: false,
  };
  render(
    React.createElement(
      FavoritesProvider,
      null,
      React.createElement(ProductCard, { product }),
    ),
  );
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Додати до обраного: Шлейка" }),
  );
  assert.equal(
    screen
      .getByRole("button", { name: "Прибрати з обраного: Шлейка" })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.deepEqual(
    JSON.parse(window.localStorage.getItem("curly-joy-favorites")),
    ["group:model"],
  );
  assert.ok(screen.getByText("Немає в наявності"));
});
test("video embeds use exact provider hosts and refuse unsafe protocols", () => {
  assert.equal(videoSource("javascript:alert(1)"), null);
  assert.equal(videoSource("http://example.com/video.mp4"), null);
  assert.equal(
    videoSource("https://user:password@example.com/video.mp4"),
    null,
  );
  assert.deepEqual(videoSource("https://youtu.be/dQw4w9WgXcQ?t=10"), {
    kind: "embed",
    src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  });
  assert.deepEqual(videoSource("https://www.youtube.com/shorts/dQw4w9WgXcQ"), {
    kind: "embed",
    src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  });
  assert.deepEqual(
    videoSource("https://player.vimeo.com/video/123456?h=abc123"),
    { kind: "embed", src: "https://player.vimeo.com/video/123456?h=abc123" },
  );
  assert.equal(
    videoSource("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ").kind,
    "link",
  );
  assert.equal(
    videoSource("https://example.com/movie.mp4?signature=token").kind,
    "file",
  );
});
test("empty review summaries never manufacture a rating", () => {
  assert.deepEqual(reviewSummary([]), { count: 0, average: 0 });
});

test("mobile menu closes on outside pointer and keyboard focus while keeping inside clicks and toggle behavior", async () => {
  const navLoad = createLoader({
    "next/navigation": { usePathname: () => "/" },
    "next/link": {
      __esModule: true,
      default: ({ children, ...props }) =>
        React.createElement("a", props, children),
    },
  });
  const { MobileNav } = navLoad("src/components/layout/mobile-nav.tsx");
  render(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(MobileNav, {
        links: [
          { href: "/catalog", label: "Каталог" },
          { href: "/business", label: "Для бізнесу" },
        ],
      }),
      React.createElement("button", { type: "button" }, "Поза меню"),
    ),
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Відкрити меню" }));
  await user.click(screen.getByRole("navigation", { name: "Мобільне меню" }));
  assert.equal(
    screen
      .getByRole("button", { name: "Закрити меню" })
      .getAttribute("aria-expanded"),
    "true",
  );
  fireEvent.pointerDown(document.body);
  assert.equal(
    screen.queryByRole("navigation", { name: "Мобільне меню" }),
    null,
  );
  await user.click(screen.getByRole("button", { name: "Відкрити меню" }));
  await user.click(screen.getByRole("button", { name: "Поза меню" }));
  assert.equal(
    screen.queryByRole("navigation", { name: "Мобільне меню" }),
    null,
  );
  assert.equal(
    document.activeElement,
    screen.getByRole("button", { name: "Поза меню" }),
  );
  await user.click(screen.getByRole("button", { name: "Відкрити меню" }));
  await user.tab();
  assert.equal(
    document.activeElement,
    screen.getByRole("link", { name: "Каталог" }),
  );
  assert.ok(screen.getByRole("navigation", { name: "Мобільне меню" }));
  await user.tab();
  await user.tab();
  assert.equal(
    screen.queryByRole("navigation", { name: "Мобільне меню" }),
    null,
  );
  assert.equal(
    document.activeElement,
    screen.getByRole("button", { name: "Поза меню" }),
  );
  await user.click(screen.getByRole("button", { name: "Відкрити меню" }));
  await user.click(screen.getByRole("button", { name: "Закрити меню" }));
  assert.equal(
    screen.queryByRole("navigation", { name: "Мобільне меню" }),
    null,
  );
});

test("CRM model gallery merges variant photos and videos without duplicates and accepts older photo-only responses", async () => {
  const { crmProductSchema } = load("src/features/catalog/crm.types.ts");
  const raw = {
    id: "variant-m",
    sku: "MODEL-M",
    name: "Шлейка M",
    status: "active",
    storefrontVisible: true,
    currency: "UAH",
    price: 500,
    compareAtPrice: null,
    prices: [],
    stock: 2,
    availability: "in_stock",
    productGroupId: "MODEL",
    size: "M",
    color: null,
    description: null,
    descriptionHtml: null,
    attributes: [],
    images: [{ url: "https://example.com/photo.jpg", alt: null }],
    videos: [{ url: "https://youtu.be/dQw4w9WgXcQ" }],
    brand: null,
    category: null,
  };
  const members = [
    crmProductSchema.parse(raw),
    crmProductSchema.parse({
      ...raw,
      id: "variant-l",
      sku: "MODEL-L",
      name: "Шлейка L",
      size: "L",
      videos: [
        ...raw.videos,
        { url: "https://example.com/video.mp4" },
        { url: "https://user:password@example.com/private.mp4" },
      ],
    }),
  ];
  const catalogLoad = createLoader({
    "server-only": {},
    "@/features/catalog/crm-api": {
      fetchProducts: async () => members,
      fetchCategories: async () => [],
    },
  });
  const { loadProducts } = catalogLoad(
    "src/features/catalog/catalog-source.ts",
  );
  const catalog = await loadProducts();
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].images.length, 1);
  assert.deepEqual(catalog[0].videos, [
    "https://youtu.be/dQw4w9WgXcQ",
    "https://example.com/video.mp4",
  ]);
  assert.deepEqual(
    crmProductSchema.parse({ ...raw, videos: undefined }).videos,
    [],
  );
});

test("review fields and rating controls have valid accessible names and ARIA", async () => {
  const axe = require("axe-core");
  const { container } = render(
    React.createElement(ReviewForm, { productId: "group:model" }),
  );
  const result = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    result.violations.map((violation) => violation.id),
    [],
  );
});

test("a manually dismissed offer does not reopen at the automatic deadline and restores scrolling", (t) => {
  window.sessionStorage.clear();
  const { WelcomeOfferDialog } = load(
    "src/features/welcome-offer/components/welcome-offer-dialog.tsx",
  );
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event("close"));
  };
  document.body.style.overflow = "auto";
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { container } = render(
    React.createElement(WelcomeOfferDialog, {
      offer: {
        id: "test-offer",
        title: "Перше знайомство",
        description: "Узгоджені умови",
      },
    }),
  );
  const dialog = container.querySelector("dialog");
  fireEvent.click(
    screen.getByRole("button", { name: "Пропозиція для першого замовлення" }),
  );
  assert.equal(dialog.open, true);
  assert.equal(document.body.style.overflow, "hidden");
  fireEvent.click(screen.getByRole("button", { name: "Закрити пропозицію" }));
  assert.equal(dialog.open, false);
  assert.equal(document.body.style.overflow, "auto");
  act(() => t.mock.timers.tick(20000));
  assert.equal(dialog.open, false);
  window.sessionStorage.clear();
});
test("welcome offer stays disabled until real terms and CRM credentials exist", async () => {
  delete process.env.WELCOME_OFFER_ENABLED;
  assert.equal(getWelcomeOffer(), null);
  enableOffer();
  delete process.env.WELCOME_OFFER_DESCRIPTION;
  assert.equal(getWelcomeOffer(), null);
  assert.equal((await submitOfferRequest(offerData())).status, "error");
  assert.equal(requests.length, 0);
});
test("offer contact requires a contact channel and explicit consent", async () => {
  enableOffer();
  const missing = await submitOfferRequest(offerData({ email: "", phone: "" }));
  assert.equal(missing.status, "error");
  assert.ok(missing.errors.email);
  assert.ok(
    (await submitOfferRequest(offerData({ consent: "" }))).errors.consent,
  );
  assert.equal(requests.length, 0);
});
test("offer requests are CRM website leads with stable retry keys", async () => {
  enableOffer();
  assert.equal((await submitOfferRequest(offerData())).status, "sent");
  assert.equal((await submitOfferRequest(offerData())).status, "sent");
  assert.equal(requests[0].path, "/leads");
  assert.equal(requests[0].body.source, "website");
  assert.equal(requests[0].body.externalId, requests[1].body.externalId);
  assert.equal(requests[0].body.email, "maria@example.com");
  assert.equal(requests[0].body.promoCode, undefined);
});

test("offer refuses changed terms and invalid phone-only contacts before CRM intake", async () => {
  enableOffer();
  const stale = offerData();
  process.env.WELCOME_OFFER_DESCRIPTION = "Оновлені умови";
  const changed = await submitOfferRequest(stale);
  assert.equal(changed.status, "error");
  assert.match(changed.message, /Умови пропозиції змінилися/);
  const invalidPhone = await submitOfferRequest(
    offerData({ email: "", phone: "----------" }),
  );
  assert.equal(invalidPhone.status, "error");
  assert.ok(invalidPhone.errors.phone);
  assert.equal(requests.length, 0);
});
test("offer requests handle CRM rate limits and malformed acknowledgments without claiming success", async () => {
  enableOffer();
  crmFailure = new CrmApiError(429);
  const state = await submitOfferRequest(offerData());
  assert.equal(state.status, "error");
  assert.match(state.message, /Забагато/);
  assert.equal(state.values.email, "maria@example.com");
  crmFailure = null;
  crmResponse = { data: {} };
  assert.equal((await submitOfferRequest(offerData())).status, "error");
});
