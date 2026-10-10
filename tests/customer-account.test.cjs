const assert = require("node:assert/strict");
const { test, beforeEach } = require("node:test");
const { createLoader } = require("./load-modules.cjs");

// The header's buyer-account link comes from the CRM's capabilities answer.
// Only the CRM transport is replaced; no network requests happen in tests.
let answer;

const load = createLoader({
  "server-only": {},
  "next/cache": { cacheLife() {}, cacheTag() {} },
});

beforeEach(() => {
  process.env.OBRIYM_CRM_API_KEY =
    "test-token-with-at-least-thirty-two-characters";
  process.env.OBRIYM_CRM_API_URL = "https://crm.test/api/v1";
  global.fetch = async (url) => {
    assert.equal(new URL(url).pathname, "/api/v1/capabilities");
    return typeof answer === "function" ? answer() : Response.json(answer);
  };
});

function capabilities(customerAccount) {
  return {
    data: {
      cart: {
        byCurrency: [],
        currency: "UAH",
        freeShippingThreshold: null,
        minOrderAmount: null,
      },
      ...(customerAccount === undefined ? {} : { customerAccount }),
      payments: [],
      shipping: [],
    },
  };
}

const { getCustomerAccountUrl } = load("src/features/customer-account/queries.ts");

test("links the buyer account the CRM reports open", async () => {
  answer = capabilities({ url: "https://curlyjoy.obriym.app/account" });
  assert.equal(
    await getCustomerAccountUrl(),
    "https://curlyjoy.obriym.app/account",
  );
});

test("shows no link while the CRM keeps the account closed", async () => {
  answer = capabilities({ url: null });
  assert.equal(await getCustomerAccountUrl(), null);
});

test("treats a CRM without the field as having no account", async () => {
  answer = capabilities(undefined);
  assert.equal(await getCustomerAccountUrl(), null);
});

test("never links an address that is not https", async () => {
  answer = capabilities({ url: "javascript:alert(1)" });
  assert.equal(await getCustomerAccountUrl(), null);
  answer = capabilities({ url: "http://curlyjoy.obriym.app/account" });
  assert.equal(await getCustomerAccountUrl(), null);
});

test("goes without the link when the CRM cannot be asked", async () => {
  answer = () =>
    Response.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
  assert.equal(await getCustomerAccountUrl(), null);
});
