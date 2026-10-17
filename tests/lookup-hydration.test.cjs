const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");
const { JSDOM } = require("jsdom");

// Emotion chooses server/client insertion behavior at module load. A separate
// process is necessary: rendering in an already initialized JSDOM hides this bug.
const server = spawnSync(process.execPath, ["-e", `
  const React = require('react');
  const { renderToString, renderToStaticMarkup } = require('react-dom/server');
  const { createLoader } = require('./tests/load-modules.cjs');
  const hooks = [];
  const load = createLoader({ 'next/navigation': { useServerInsertedHTML: (hook) => hooks.push(hook) } });
  const App = require('./tests/fixtures/lookup-hydration.cjs').createLookupApp(load);
  const html = renderToString(React.createElement(App));
  const styles = hooks.map(hook => renderToStaticMarkup(hook())).join('');
  const repeatedFlush = hooks.map(hook => renderToStaticMarkup(hook())).join('');
  hooks.length = 0;
  renderToString(React.createElement(App));
  const nextRequestStyles = hooks.map(hook => renderToStaticMarkup(hook())).join('');
  process.stdout.write(JSON.stringify({html, styles, repeatedFlush, nextRequestStyles}));
`], { cwd: require("node:path").resolve(__dirname, ".."), encoding: "utf8", timeout: 30_000 });
assert.equal(server.status, 0, server.stderr);
const rendered = JSON.parse(server.stdout);

test("server styles are collected separately, flushed once and isolated between renders", () => {
  assert.doesNotMatch(rendered.html, /<style/);
  assert.match(rendered.styles, /data-emotion="cjp /);
  assert.match(rendered.styles, /\.cjp-/);
  assert.equal(rendered.repeatedFlush, "");
  assert.equal(rendered.nextRequestStyles, rendered.styles);
});

test("the real react-select hydrates server HTML without style mismatches and still supports keyboard selection", async () => {
  const dom = new JSDOM(`<!doctype html><html><head>${rendered.styles}</head><body><div id="root">${rendered.html}</div></body></html>`, {
    url: "http://localhost/checkout",
  });
  for (const name of ["window", "document", "HTMLElement", "HTMLInputElement", "Element", "Node", "MutationObserver", "getComputedStyle"]) {
    globalThis[name] = dom.window[name];
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const React = require("react");
  const { hydrateRoot } = require("react-dom/client");
  const { act, fireEvent } = require("@testing-library/react");
  const { createLoader } = require("./load-modules.cjs");
  const load = createLoader({ "next/navigation": { useServerInsertedHTML() {} } });
  const App = require("./fixtures/lookup-hydration.cjs").createLookupApp(load);
  const container = document.getElementById("root");
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args.map(String).join(" "));
  let root;
  try {
    await act(async () => {
      root = hydrateRoot(container, React.createElement(App), {
        onRecoverableError: (error) => errors.push(error.message),
      });
    });
    assert.deepEqual(errors, []);
    assert.equal(container.querySelector("style"), null);
    const input = container.querySelector('[role="combobox"]');
    assert.ok(input);
    assert.equal(document.querySelector("label").htmlFor, input.id);
    act(() => input.focus());
    fireEvent.keyDown(input, { key: "ArrowDown", code: "ArrowDown" });
    assert.ok(container.querySelector('[role="listbox"]'));
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    assert.match(container.textContent, /Kyiv/);
    assert.equal(container.querySelector('[role="listbox"]'), null);
    assert.deepEqual(errors, []);
  } finally {
    if (root) await act(async () => root.unmount());
    console.error = originalError;
    dom.window.close();
  }
});
