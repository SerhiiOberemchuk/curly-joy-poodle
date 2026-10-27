const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-modules.cjs");
const m = createLoader({})("src/features/checkout/marketing-consent.ts");

test("checked with flag on sends email consent with the exact label", () => {
  assert.deepEqual(m.marketingConsentPayload(true, true), {
    email: true,
    text: m.MARKETING_CONSENT_TEXT,
  });
  assert.equal(
    m.MARKETING_CONSENT_TEXT,
    "Хочу отримувати новини та пропозиції Curly Joy на email",
  );
});

test("unchecked sends nothing — never email:false", () => {
  assert.equal(m.marketingConsentPayload(false, true), undefined);
});

test("flag off sends nothing even when checked", () => {
  assert.equal(m.marketingConsentPayload(true, false), undefined);
});

test("flag is on only for the literal string true", () => {
  assert.equal(m.marketingConsentEnabled("true"), true);
  for (const v of [undefined, "", "false", "1", "TRUE"])
    assert.equal(m.marketingConsentEnabled(v), false);
});
