const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-modules.cjs");
const a = createLoader({})("src/lib/attribution.ts");
const DAY = 86_400_000;

test("only allowed params are read; click id names its platform", () => {
  assert.deepEqual(
    a.parseTouch("?utm_source=instagram&utm_medium=paid&utm_campaign=autumn&fbclid=abc&token=secret"),
    { utmSource: "instagram", utmMedium: "paid", utmCampaign: "autumn", clickId: "abc", clickIdParam: "fbclid" },
  );
  assert.equal(a.parseTouch("?token=secret&ref=x"), null);
});

test("first touch kept for 30 days, later tagged visit is last touch", () => {
  const first = a.mergeAttribution(null, { utmSource: "a" }, 1000);
  assert.deepEqual(first, { first: { at: 1000, touch: { utmSource: "a" } } });
  const next = a.mergeAttribution(first, { utmSource: "b" }, 2000);
  assert.equal(next.first.touch.utmSource, "a");
  assert.equal(next.last.touch.utmSource, "b");
  assert.equal(a.mergeAttribution(first, null, 2000), first);
});

test("expired first touch is replaced or dropped", () => {
  const old = { first: { at: 0, touch: { utmSource: "a" } } };
  const now = 31 * DAY;
  assert.equal(a.mergeAttribution(old, null, now), null);
  assert.equal(a.mergeAttribution(old, { utmSource: "b" }, now).first.touch.utmSource, "b");
});

test("payload omits empty block and last touch equal to first", () => {
  assert.equal(a.toCrmAttribution(null, 1), undefined);
  const s = { first: { at: 1000, touch: { utmSource: "a" } }, last: { at: 2000, touch: { utmSource: "a" } } };
  assert.deepEqual(a.toCrmAttribution(s, 3000), { utmSource: "a" });
  s.last.touch = { utmSource: "b" };
  assert.deepEqual(a.toCrmAttribution(s, 3000), {
    utmSource: "a",
    lastTouch: { utmSource: "b", at: new Date(2000).toISOString() },
  });
});

test("malformed storage and submitted input never yield nulls", () => {
  assert.equal(a.parseStored("{bad"), null);
  assert.equal(a.parseSubmittedAttribution(""), undefined);
  assert.equal(a.parseSubmittedAttribution('{"x":1}'), undefined);
  assert.deepEqual(
    a.parseSubmittedAttribution('{"utmSource":" ig ","utmTerm":null,"junk":"x"}'),
    { utmSource: "ig" },
  );
});
