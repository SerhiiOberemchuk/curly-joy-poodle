"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";

/** Collect react-select's Emotion rules before Next streams the corresponding HTML. */
export function EmotionRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "cjp" });
    // Keep rules in the cache instead of emitting style elements inside controls.
    cache.compat = true;
    const originalInsert = cache.insert;
    let pending: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) pending.push(serialized.name);
      return originalInsert(...args);
    };
    return {
      cache,
      flush() {
        const names = pending;
        pending = [];
        return names;
      },
    };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    const css = names.map((name) => cache.inserted[name]).filter((rule) => typeof rule === "string").join("");
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: css }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
