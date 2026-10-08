"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import headerStyles from "@/components/layout/site-header.module.css";
import type { ProductListItem } from "@/features/catalog/types";
import { formatMoney } from "@/lib/money";
import styles from "../reference.module.css";
import { HomeIcon } from "./home-icon";

interface HomeSelection {
  query: string;
  setQuery: (query: string) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const SelectionContext = createContext<HomeSelection | null>(null);

function useSelection() {
  const selection = useContext(SelectionContext);
  if (!selection)
    throw new Error("Home controls require HomeSelectionProvider");
  return selection;
}

export function HomeSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("curly-joy-favorites");
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((item): item is string => typeof item === "string"));
        }
      } catch {
        window.localStorage.removeItem("curly-joy-favorites");
      }
    }
    setFavoritesLoaded(true);
  }, []);

  useEffect(() => {
    if (favoritesLoaded) {
      window.localStorage.setItem("curly-joy-favorites", JSON.stringify(favorites));
    }
  }, [favorites, favoritesLoaded]);

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <SelectionContext
      value={{
        query,
        setQuery,
        favorites,
        toggleFavorite,
      }}
    >
      {children}
    </SelectionContext>
  );
}

function useShowRecommendations() {
  const router = useRouter();

  return () => {
    if (window.location.pathname !== "/") {
      router.push("/#recommendations");
      return;
    }

    document
      .getElementById("recommendations")
      ?.scrollIntoView({ block: "center" });
  };
}

export function HomeSearch() {
  const { query, setQuery } = useSelection();
  const showRecommendations = useShowRecommendations();

  return (
    <form
      className={headerStyles.search}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        showRecommendations();
      }}
    >
      <button type="submit" aria-label="Шукати товари">
        <HomeIcon name="search" />
      </button>
      <input
        type="search"
        aria-label="Пошук товарів"
        placeholder="Пошук товарів…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
    </form>
  );
}

export function HomeFavorites() {
  const { favorites } = useSelection();
  return (
    <Link
      href="/favorites"
      className={headerStyles.iconButton}
      aria-label={`Обране: ${favorites.length}`}
    >
      <HomeIcon name="heart" />
      {favorites.length > 0 && (
        <span className={headerStyles.favoriteCount}>{favorites.length}</span>
      )}
    </Link>
  );
}

export function HomeProductCards({
  products: recommendations,
}: {
  products: readonly ProductListItem[];
}) {
  const { query, setQuery } = useSelection();
  const normalizedQuery = query.trim().toLocaleLowerCase("uk");
  const products = recommendations.filter(
    (product) =>
      `${product.brand ?? ""} ${product.title}`
        .toLocaleLowerCase("uk")
        .includes(normalizedQuery),
  );

  return (
    <div className={styles.productResults}>
      <p className="visually-hidden" role="status">
        {query ? `Знайдено товарів: ${products.length}` : ""}
      </p>
      {products.length ? (
        <div className={styles.productGrid}>
          {products.map((product) => <HomeProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className={styles.emptyResults}>
          <HomeIcon name="search" />
          <p>У цій добірці нічого не знайшлося. Спробуйте іншу назву.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
            }}
          >
            Показати всі рекомендації <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function HomeProductCard({ product }: { product: ProductListItem }) {
  const { favorites, toggleFavorite } = useSelection();
  const selected = favorites.includes(product.id);

  return (
    <article className={styles.productCard}>
      <button
        className={styles.productFavorite}
        type="button"
        aria-pressed={selected}
        aria-label={`${selected ? "Прибрати з обраного" : "Додати до обраного"}: ${product.title}`}
        onClick={() => toggleFavorite(product.id)}
      >
        <HomeIcon name="heart" />
      </button>
      <Link href={`/product/${product.slug}`} className={styles.productLink}>
        <div className={styles.productImage}>
          {product.image.src ? (
            <Image src={product.image.src} alt={product.image.alt} fill sizes="(max-width: 768px) 45vw, 240px" />
          ) : (
            <span className={styles.productPlaceholder} aria-hidden="true">🐾</span>
          )}
        </div>
        {product.brand ? <h3>{product.brand}</h3> : null}
        <p>{product.title}</p>
        <strong>
          {product.options.length > 1 ? "від " : ""}
          {formatMoney(product.priceFrom)}
        </strong>
      </Link>
    </article>
  );
}

export function FavoriteProductCards({
  products: catalog,
}: {
  products: readonly ProductListItem[];
}) {
  const { favorites } = useSelection();
  const products = catalog.filter((product) => favorites.includes(product.id));

  if (!products.length) {
    return (
      <div className={styles.emptyResults}>
        <HomeIcon name="heart" />
        <p>Тут з’являться товари, які ви позначите сердечком.</p>
        <Link href="/#recommendations">Переглянути рекомендації <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  return (
    <div className={styles.favoriteGrid}>
      {products.map((product) => <HomeProductCard key={product.id} product={product} />)}
    </div>
  );
}
