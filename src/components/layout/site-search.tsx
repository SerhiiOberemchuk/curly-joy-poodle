"use client";

import Image from "next/image";
import Form from "next/form";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type Ref,
} from "react";
import useSWR from "swr";
import { useDebounce, useDebouncedCallback } from "use-debounce";

import { Icon } from "@/components/ui/icon";
import {
  searchSuggestionsAction,
  type SearchSuggestion,
} from "@/features/catalog/search.actions";
import { formatMoney } from "@/lib/money";

import styles from "./site-header.module.css";

const MIN_QUERY = 2;

/**
 * Header search. A plain GET form to /catalog?q=…, so it works without
 * JavaScript. On the catalog the list itself updates while the buyer types;
 * elsewhere a dropdown shows the first matches and a link to all of them, so
 * typing never takes the buyer away from the page they are on.
 * On phones the field sits behind a search icon in the header bar.
 */
export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const areaRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    areaRef.current?.querySelector("input")?.focus();

    function closeOutside(event: Event) {
      if (!event.composedPath().includes(areaRef.current as EventTarget)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open]);

  function close() {
    if (!open) return;
    setOpen(false);
    toggleRef.current?.focus();
  }

  return (
    <div ref={areaRef} className={styles.searchArea} data-open={open || undefined}>
      <button
        ref={toggleRef}
        type="button"
        className={`${styles.iconButton} ${styles.searchToggle}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Закрити пошук" : "Відкрити пошук"}
        onClick={() => setOpen(!open)}
      >
        <Icon name={open ? "close" : "search"} />
      </button>
      <div id={panelId} className={styles.searchPanel}>
        <Suspense fallback={<SearchForm />}>
          <LiveSearch onEscape={close} onLeave={() => setOpen(false)} />
        </Suspense>
      </div>
    </div>
  );
}

function LiveSearch(props: SearchControlsProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const onCatalog = pathname === "/catalog";
  // A new page starts with a fresh field and no open suggestions.
  return (
    <SearchControls
      key={pathname}
      {...props}
      onCatalog={onCatalog}
      query={onCatalog ? params.get("q") ?? "" : ""}
    />
  );
}

interface SearchControlsProps {
  /** Escape in a field without suggestions closes the phone search panel. */
  onEscape: () => void;
  /** The buyer submitted or picked a result: the phone panel can close. */
  onLeave: () => void;
}

function SearchControls({
  onEscape,
  onLeave,
  onCatalog,
  query,
}: SearchControlsProps & { onCatalog: boolean; query: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const search = useDebouncedCallback(() => formRef.current?.requestSubmit(), 400);
  const [draft, setDraft] = useState(query);
  const [suggesting, setSuggesting] = useState(false);
  const statusId = useId();

  // The catalog URL seeds the field; an active draft keeps its caret.
  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement !== input) input.value = query;
  }, [query]);

  function scheduleSearch(value: string) {
    search.cancel();
    if (composing.current || !onCatalog) return;
    const text = value.trim();
    if (text.length >= MIN_QUERY || text.length === 0) search();
  }

  function handleInput(value: string) {
    setDraft(value);
    setSuggesting(!onCatalog && !composing.current);
    scheduleSearch(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      if (suggesting && draft.trim().length >= MIN_QUERY) {
        event.preventDefault();
        setSuggesting(false);
        inputRef.current?.focus();
      } else {
        onEscape();
      }
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = [...(suggestionsRef.current?.querySelectorAll("a") ?? [])];
    if (links.length === 0) return;
    event.preventDefault();
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      event.key === "ArrowDown"
        ? Math.min(links.length - 1, current + 1)
        : current - 1;
    if (next < 0) inputRef.current?.focus();
    else links[next].focus();
  }

  const term = draft.trim();
  const showSuggestions = suggesting && !onCatalog && term.length >= MIN_QUERY;

  return (
    <SearchForm
      formRef={formRef}
      replace={onCatalog}
      scroll={false}
      onSubmit={(event) => {
        search.cancel();
        // An empty search outside the catalog has nothing to show: stay put.
        if (!onCatalog && !inputRef.current?.value.trim()) {
          event.preventDefault();
          inputRef.current?.focus();
          return;
        }
        setSuggesting(false);
        // Live catalog updates must keep the phone field open for continued typing.
        if (!onCatalog) onLeave();
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        search.cancel();
        setSuggesting(false);
      }}
      onKeyDown={handleKeyDown}
      inputProps={{
        ref: inputRef,
        defaultValue: query,
        "aria-describedby": showSuggestions ? statusId : undefined,
        onChange: (event) => handleInput(event.currentTarget.value),
        // Coming back from a result (Escape) must not reopen the list.
        onFocus: (event) => {
          if (!event.currentTarget.form?.contains(event.relatedTarget))
            setSuggesting(!onCatalog);
        },
        onCompositionStart: () => {
          composing.current = true;
          search.cancel();
        },
        onCompositionEnd: (event) => {
          composing.current = false;
          handleInput(event.currentTarget.value);
        },
      }}
    >
      {showSuggestions ? (
        <Suggestions
          ref={suggestionsRef}
          term={term}
          statusId={statusId}
          onPick={() => {
            setSuggesting(false);
            onLeave();
          }}
        />
      ) : null}
    </SearchForm>
  );
}

function Suggestions({
  ref,
  term,
  statusId,
  onPick,
}: {
  ref: Ref<HTMLDivElement>;
  term: string;
  statusId: string;
  onPick: () => void;
}) {
  const [settled] = useDebounce(term, 300);
  const waiting = settled !== term;
  const { data, error, isLoading } = useSWR(
    waiting ? null : ["site-search", settled],
    async ([, query]) => {
      const result = await searchSuggestionsAction(query);
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  const loading = waiting || isLoading;

  return (
    <div ref={ref} className={styles.suggestions}>
      <p id={statusId} className="visually-hidden" role="status">
        {loading
          ? "Шукаємо…"
          : error
            ? "Не вдалося виконати пошук"
            : data
              ? `Знайдено товарів: ${data.total}`
              : ""}
      </p>
      {error && !loading ? (
        <p className={styles.suggestionsMessage}>
          Не вдалося виконати пошук. Натисніть Enter, щоб відкрити результати в каталозі.
        </p>
      ) : !data || (loading && data.items.length === 0) ? (
        <p className={styles.suggestionsMessage} aria-hidden="true">
          Шукаємо…
        </p>
      ) : data.total === 0 ? (
        <p className={styles.suggestionsMessage}>
          За запитом «{term}» нічого не знайшлося. Спробуйте інше слово.
        </p>
      ) : (
        <>
          <ul className={styles.suggestionList} aria-label="Швидкі результати пошуку">
            {data.items.map((item) => (
              <li key={item.id}>
                <SuggestionLink item={item} onPick={onPick} />
              </li>
            ))}
          </ul>
          <Link
            href={{ pathname: "/catalog", query: { q: term } }}
            className={styles.suggestionsAll} onClick={onPick}>
            Дивитись усі результати ({data.total})
            <Icon name="arrow" />
          </Link>
        </>
      )}
    </div>
  );
}

function SuggestionLink({
  item,
  onPick,
}: {
  item: SearchSuggestion;
  onPick: () => void;
}) {
  return (
    <Link href={`/product/${item.slug}`} className={styles.suggestion} onClick={onPick}>
      <span className={styles.suggestionImage} aria-hidden="true">
        {item.image.src ? (
          <Image src={item.image.src} alt="" fill sizes="52px" />
        ) : null}
      </span>
      <span className={styles.suggestionTitle}>{item.title}</span>
      <span className={styles.suggestionPrice}>
        {item.priced === "from" ? "від " : ""}
        {formatMoney(item.priceFrom)}
      </span>
    </Link>
  );
}

function SearchForm({
  formRef,
  inputProps,
  children,
  ...props
}: Pick<
  ComponentProps<typeof Form>,
  "replace" | "scroll" | "onSubmit" | "onBlur" | "onKeyDown" | "children"
> & {
  formRef?: Ref<HTMLFormElement>;
  inputProps?: Pick<
    ComponentProps<"input">,
    | "ref"
    | "defaultValue"
    | "aria-describedby"
    | "onChange"
    | "onFocus"
    | "onCompositionStart"
    | "onCompositionEnd"
  >;
}) {
  return (
    <Form {...props} ref={formRef} action="/catalog" role="search">
      <div className={styles.search}>
        <input
          {...inputProps}
          type="search"
          name="q"
          aria-label="Пошук товарів"
          placeholder="Пошук товарів…"
          maxLength={100}
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" aria-label="Шукати">
          <Icon name="search" />
        </button>
      </div>
      {children}
    </Form>
  );
}
