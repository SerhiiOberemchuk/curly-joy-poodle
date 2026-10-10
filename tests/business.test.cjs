const assert = require("node:assert/strict");
const { test, beforeEach } = require("node:test");
const { createLoader } = require("./load-modules.cjs");

// The real B2B request module; only the CRM transport is replaced. No network
// requests or CRM writes happen in tests.
let requests;

const load = createLoader({ "server-only": {} });

beforeEach(() => {
  requests = [];
  process.env.OBRIYM_CRM_API_KEY =
    "test-token-with-at-least-thirty-two-characters";
  process.env.OBRIYM_CRM_API_URL = "https://crm.test/api/v1";
  global.fetch = async (url, options) => {
    const path = new URL(url).pathname.replace("/api/v1", "");
    requests.push({ path, body: options.body ? JSON.parse(options.body) : null });
    return Response.json(
      { data: { id: "lead-1", status: "created", deduplicated: false } },
      { status: 201 },
    );
  };
});

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const B2B_REQUEST = {
  companyName: "ФОП Коваленко",
  contactName: "Олена Коваленко",
  phone: "067 440 43 94",
  email: "Shop@Example.com",
  businessType: "Грумінг-салон",
  city: "Рівне",
  website: "",
  message: "Цікавлять светри",
  requestId: "6f1c2b8e-4a3d-4b1e-9c7f-2d8e5a1b3c4d",
};

test("a wholesale access request files a partner lead with a stable idempotency key", async () => {
  const { requestB2bAccessAction } = load("src/features/business/actions.ts");
  const state = await requestB2bAccessAction(
    { status: "idle", message: "", errors: {} },
    form(B2B_REQUEST),
  );
  assert.equal(state.status, "sent");
  assert.equal(requests.length, 1);
  const lead = requests[0].body;
  assert.equal(requests[0].path, "/leads");
  assert.equal(lead.source, "partner");
  assert.equal(lead.externalId, `b2b-${B2B_REQUEST.requestId}`);
  assert.equal(lead.email, "shop@example.com");
  assert.equal(lead.phone, "+380674404394");
  assert.equal(lead.companyName, "ФОП Коваленко");
  assert.match(lead.notes, /Тип бізнесу: Грумінг-салон/);
  assert.match(lead.notes, /Коментар: Цікавлять светри/);
});

test("an invalid wholesale request is refused before the CRM and keeps the input", async () => {
  const { requestB2bAccessAction } = load("src/features/business/actions.ts");
  const state = await requestB2bAccessAction(
    { status: "idle", message: "", errors: {} },
    form({ ...B2B_REQUEST, phone: "дзвоніть" }),
  );
  assert.equal(state.status, "error");
  assert.ok(state.errors.phone);
  assert.equal(state.values.companyName, "ФОП Коваленко");
  assert.equal(requests.length, 0);
});

test("a CRM refusal keeps the input and invites a retry", async () => {
  global.fetch = async () =>
    Response.json({ error: { code: "SERVER_ERROR" } }, { status: 500 });
  const { requestB2bAccessAction } = load("src/features/business/actions.ts");
  const state = await requestB2bAccessAction(
    { status: "idle", message: "", errors: {} },
    form(B2B_REQUEST),
  );
  assert.equal(state.status, "error");
  assert.match(state.message, /Не вдалося надіслати запит/);
  assert.equal(state.values.email, "Shop@Example.com");
});
