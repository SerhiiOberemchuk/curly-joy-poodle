const fs = require("node:fs");
const path = require("node:path");
const swc = require("next/dist/build/swc");

exports.createLoader = function createLoader(mocks) {
  const root = path.resolve(__dirname, "..");
  const modules = new Map();
  function load(filename) {
    filename = path.resolve(root, filename);
    if (modules.has(filename)) return modules.get(filename).exports;
    const record = { exports: {} };
    modules.set(filename, record);
    const { code } = swc.transformSync(fs.readFileSync(filename, "utf8"), {
      filename,
      jsc: {
        parser: { syntax: "typescript", tsx: filename.endsWith(".tsx") },
        target: "es2022",
        transform: { react: { runtime: "automatic" } },
      },
      module: { type: "commonjs" },
    });
    function localRequire(name) {
      const absolute = name.startsWith("@/")
        ? path.join(root, "src", name.slice(2))
        : name.startsWith(".")
          ? path.resolve(path.dirname(filename), name)
          : null;
      const key = absolute
        ? "@/" +
          path.relative(path.join(root, "src"), absolute).replaceAll("\\", "/")
        : name;
      if (Object.hasOwn(mocks, key)) return mocks[key];
      if (name.endsWith(".css"))
        return {
          __esModule: true,
          default: new Proxy({}, { get: (_, key) => String(key) }),
        };
      if (!absolute) return require(name);
      return load(
        [
          absolute + ".ts",
          absolute + ".tsx",
          path.join(absolute, "index.ts"),
        ].find(fs.existsSync),
      );
    }
    new Function("require", "module", "exports", code)(
      localRequire,
      record,
      record.exports,
    );
    return record.exports;
  }

  return load;
};
