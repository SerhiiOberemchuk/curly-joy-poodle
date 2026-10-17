const assert = require("node:assert/strict");
const { test, mock, beforeEach, afterEach } = require("node:test");
const { createLoader } = require("./load-modules.cjs");
let calls, failure, offerFailure, response, offer, revision, logs;
class CrmApiError extends Error {
  constructor(status) {
    super();
    this.status = status;
  }
}
const load = createLoader({
  "server-only": {},
  "@/lib/visitor": {
    visitorHeaders: async () => ({ "x-obriym-visitor": "hash" }),
  },
  "@/lib/crm-client": {
    CrmApiError,
    crmRequest: async (path, body, headers) => {
      calls.push({ path, body, headers });
      if (body === undefined) {
        if (offerFailure) throw offerFailure;
        return { data: offer };
      }
      if (failure) throw failure;
      return response;
    },
  },
});
const { getWelcomeOffer, submitOfferRequest } = load(
  "src/features/welcome-offer/offer.server.ts",
);
const keys = [
  "WELCOME_OFFER_ENABLED",
  "WELCOME_OFFER_CAMPAIGN_ID",
  "OBRIYM_CRM_API_KEY",
];
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
beforeEach(async () => {
  calls = [];
  failure = null;
  offerFailure = null;
  logs = mock.method(console, "error", () => {});
  offer = {
    campaignId: "welcome",
    title: "Внутрішня назва акції",
    terms: "Внутрішні умови",
    consentText: "Згода з CRM",
    shopName: "Curly Joy",
    discountType: "percent",
    discountValue: "5.00",
    currency: "UAH",
    maxDiscountAmount: null,
    minimumAmount: "800.00",
    codeLifetimeHours: 72,
    endsAt: "2026-10-31T00:00:00.000Z",
    emailLocales: ["uk", "en"],
  };
  response = { data: { status: "accepted" } };
  process.env.WELCOME_OFFER_ENABLED = "true";
  process.env.WELCOME_OFFER_CAMPAIGN_ID = "welcome";
  process.env.OBRIYM_CRM_API_KEY = "test-only";
  revision = (await getWelcomeOffer("uk")).revision;
  calls = [];
});
afterEach(() => {
  logs.mock.restore();
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
// Intl separates numbers and units with no-break spaces.
const plain = (text) => text.replace(/\s/gu, " ");
function data(overrides = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    offerId: "welcome",
    offerRevision: revision,
    locale: "uk",
    email: "Maria@Example.com",
    consent: "on",
    ...overrides,
  }))
    form.set(key, value);
  return form;
}
test("capture is off until flag, campaign and a CRM offer with figures in the shop currency exist", async () => {
  delete process.env.WELCOME_OFFER_CAMPAIGN_ID;
  assert.equal(await getWelcomeOffer("uk"), null);
  assert.equal(calls.length, 0);
  process.env.WELCOME_OFFER_CAMPAIGN_ID = "welcome";
  const { campaignId, title, terms, consentText } = offer;
  offer = { campaignId, title, terms, consentText };
  assert.equal(await getWelcomeOffer("uk"), null);
  offer = {
    campaignId,
    discountType: "percent",
    discountValue: "5.00",
    currency: "EUR",
    maxDiscountAmount: null,
    minimumAmount: null,
    codeLifetimeHours: 72,
    endsAt: null,
    emailLocales: ["uk"],
  };
  assert.equal(await getWelcomeOffer("uk"), null);
});
test("the shop renders its own copy around the CRM figures, never the campaign texts", async () => {
  const shown = await getWelcomeOffer("uk");
  assert.equal(shown.locale, "uk");
  assert.equal(plain(shown.title), "−5% на перше замовлення");
  assert.match(shown.teaser, /знижку 5% для першого замовлення/);
  assert.equal(
    plain(shown.description),
    "Промокод діє 3 дні після надсилання листа, але не довше ніж до 31 жовтня 2026 р. о 02:00. Мінімальна сума замовлення — 800 ₴. Застосуйте код з тим самим email, на який він прийде.",
  );
  assert.match(shown.consentText, /^Погоджуюся, щоб Curly Joy/);
  assert.equal(
    [shown.title, shown.description, shown.consentText].some((text) =>
      /Внутрішн|Згода з CRM/.test(text),
    ),
    false,
  );
  Object.assign(offer, {
    discountType: "fixed",
    discountValue: "150.00",
    maxDiscountAmount: "300.00",
    minimumAmount: null,
    codeLifetimeHours: 36,
    endsAt: null,
  });
  const fixed = await getWelcomeOffer("uk");
  assert.equal(plain(fixed.title), "−150 ₴ на перше замовлення");
  assert.equal(
    plain(fixed.description),
    "Промокод діє 36 годин після надсилання листа. Застосуйте код з тим самим email, на який він прийде.",
  );
  Object.assign(offer, { discountType: "percent", discountValue: "12.50" });
  const capped = await getWelcomeOffer("uk");
  assert.equal(plain(capped.title), "−12,5% на перше замовлення");
  assert.match(plain(capped.description), /Знижка — не більше 300 ₴\./);
});
test("capture sends one step with normalized email, the consent shown, the email language and visitor key", async () => {
  const shown = await getWelcomeOffer("uk");
  const { state, stale } = await submitOfferRequest(data());
  assert.equal(state.status, "sent");
  assert.equal(stale, undefined);
  assert.match(state.message, /лист із промокодом уже в дорозі/);
  assert.deepEqual(calls.at(-1), {
    path: "/promotions/welcome/capture",
    body: {
      email: "maria@example.com",
      consent: true,
      consentText: shown.consentText,
      locale: "uk",
    },
    headers: { "x-obriym-visitor": "hash" },
  });
  assert.equal(
    calls.some(({ path }) => path === "/leads" || path.includes("customers")),
    false,
  );
});
test("capture leaves the email language to the CRM when it cannot write in the shop's", async () => {
  offer.emailLocales = ["en"];
  const { state } = await submitOfferRequest(data());
  assert.equal(state.status, "sent");
  assert.equal("locale" in calls.at(-1).body, false);
});
test("capture refuses invalid contact, missing consent, tampered campaign and honeypot before writes", async () => {
  for (const input of [
    { email: "bad" },
    { consent: "" },
    { offerId: "other" },
    { website: "bot" },
  ]) {
    assert.equal((await submitOfferRequest(data(input))).state.status, "error");
  }
  assert.equal(
    calls.some(({ body }) => body !== undefined),
    false,
  );
});
test("changed CRM figures refresh the offer in place instead of accepting consent to old terms", async () => {
  const form = data();
  offer.discountValue = "10.00";
  const { state, stale } = await submitOfferRequest(form);
  assert.equal(state.status, "error");
  assert.equal(stale, true);
  assert.match(state.message, /Умови пропозиції оновилися/);
  assert.doesNotMatch(state.message, /Оновіть сторінку/);
  assert.equal(state.values.email, "Maria@Example.com");
  assert.equal(
    calls.some(({ body }) => body !== undefined),
    false,
  );
});
test("capture handles rate limits, unavailable offer, outages and malformed acknowledgments", async () => {
  const message = async () => (await submitOfferRequest(data())).state.message;
  failure = new CrmApiError(429);
  assert.match(await message(), /Забагато/);
  failure = new CrmApiError(404);
  assert.match(await message(), /недоступна/);
  failure = new CrmApiError(500);
  assert.match(await message(), /Не вдалося/);
  failure = null;
  response = { data: {} };
  assert.equal((await submitOfferRequest(data())).state.status, "error");
});
test("a hidden offer explains itself in the server log without the buyer's email", async () => {
  process.env.WELCOME_OFFER_ENABLED = "false";
  assert.equal(await getWelcomeOffer("uk"), null);
  assert.equal(logs.mock.callCount(), 0);
  process.env.WELCOME_OFFER_ENABLED = "true";
  delete process.env.WELCOME_OFFER_CAMPAIGN_ID;
  assert.equal(await getWelcomeOffer("uk"), null);
  assert.match(logs.mock.calls.at(-1).arguments[0], /WELCOME_OFFER_CAMPAIGN_ID/);
  process.env.WELCOME_OFFER_CAMPAIGN_ID = "welcome";
  offerFailure = new CrmApiError(404);
  offerFailure.code = "NOT_FOUND";
  assert.equal(await getWelcomeOffer("uk"), null);
  assert.deepEqual(logs.mock.calls.at(-1).arguments[1], {
    campaignId: "welcome",
    status: 404,
    code: "NOT_FOUND",
    reason: undefined,
    hint: "No active campaign with this WELCOME_OFFER_CAMPAIGN_ID for the token's sales source.",
  });
  offerFailure = null;
  delete offer.emailLocales;
  assert.equal(await getWelcomeOffer("uk"), null);
  assert.deepEqual(logs.mock.calls.at(-1).arguments[1].invalidFields, [
    "data.emailLocales",
  ]);
  offer.emailLocales = ["uk"];
  offer.currency = "EUR";
  assert.equal(await getWelcomeOffer("uk"), null);
  assert.equal(logs.mock.calls.at(-1).arguments[1].currency, "EUR");
  offer.currency = "UAH";
  revision = (await getWelcomeOffer("uk")).revision;
  const before = logs.mock.callCount();
  failure = new CrmApiError(429);
  await submitOfferRequest(data());
  assert.equal(logs.mock.callCount(), before);
  failure = new CrmApiError(500);
  await submitOfferRequest(data());
  assert.equal(logs.mock.callCount(), before + 1);
  assert.doesNotMatch(
    JSON.stringify(logs.mock.calls.map((call) => call.arguments)),
    /maria/i,
  );
});
