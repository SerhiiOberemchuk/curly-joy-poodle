"use client";

import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, type ComponentProps, type Ref } from "react";
import { useDebouncedCallback } from "use-debounce";

import { Icon } from "@/components/ui/icon";

import styles from "./site-header.module.css";

/**
 * Catalog search. A plain GET form to /catalog?q=…, so it works without
 * JavaScript; enhanced with debounced submission after two typed characters.
 */
export function SiteSearch() {
  return (
    <Suspense fallback={<SearchForm />}>
      <LiveSearch />
    </Suspense>
  );
}

function LiveSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = pathname === "/catalog" ? params.get("q") ?? "" : "";
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const search = useDebouncedCallback(() => formRef.current?.requestSubmit(), 400);

  // A pending search must not take the buyer back after leaving the catalog.
  useEffect(() => {
    if (pathname !== "/catalog") search.cancel();
  }, [pathname, search]);

  // The URL seeds direct visits and navigation; an active draft keeps its caret.
  useEffect(() => {
    const input = inputRef.current;
    if (input && (pathname !== "/catalog" || document.activeElement !== input)) {
      input.value = query;
    }
  }, [pathname, query]);

  function scheduleSearch(value: string) {
    search.cancel();
    if (composing.current) return;
    const draft = value.trim();
    if (draft.length >= 2 || (draft.length === 0 && pathname === "/catalog")) {
      search();
    }
  }

  return (
    <SearchForm
      formRef={formRef}
      replace={pathname === "/catalog"}
      scroll={false}
      onSubmit={() => search.cancel()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) search.cancel();
      }}
      inputProps={{
        ref: inputRef,
        defaultValue: query,
        onChange: (event) => scheduleSearch(event.currentTarget.value),
        onCompositionStart: () => {
          composing.current = true;
          search.cancel();
        },
        onCompositionEnd: (event) => {
          composing.current = false;
          scheduleSearch(event.currentTarget.value);
        },
      }}
    />
  );
}

function SearchForm({
  formRef,
  inputProps,
  ...props
}: Pick<ComponentProps<typeof Form>, "replace" | "scroll" | "onSubmit" | "onBlur"> & {
  formRef?: Ref<HTMLFormElement>;
  inputProps?: Pick<ComponentProps<"input">, "ref" | "defaultValue" | "onChange" | "onCompositionStart" | "onCompositionEnd">;
}) {
  return (
    <Form {...props} ref={formRef} action="/catalog" className={styles.search} role="search">
      <input
        {...inputProps}
        type="search"
        name="q"
        aria-label="Пошук товарів"
        placeholder="Пошук товарів…"
        maxLength={100}
        enterKeyHint="search"
      />
      <button type="submit" aria-label="Шукати">
        <Icon name="search" />
      </button>
    </Form>
  );
}
