"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";

import headerStyles from "@/components/layout/site-header.module.css";
import { homeRecommendations } from "../reference-content";
import styles from "../reference.module.css";
import { HomeIcon } from "./home-icon";
import { ReferenceArtwork } from "./reference-artwork";

interface HomeSelection {
  query: string;
  setQuery: (query: string) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
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
  const [favoritesOnly, setFavoritesOnly] = useState(false);

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
        favoritesOnly,
        setFavoritesOnly,
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
  const { query, setQuery, setFavoritesOnly } = useSelection();
  const showRecommendations = useShowRecommendations();

  return (
    <form
      className={headerStyles.search}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        setFavoritesOnly(false);
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
          setFavoritesOnly(false);
        }}
      />
    </form>
  );
}

export function HomeFavorites() {
  const showRecommendations = useShowRecommendations();
  const { favoritesOnly, setFavoritesOnly, favorites, setQuery } =
    useSelection();
  return (
    <button
      type="button"
      className={headerStyles.iconButton}
      aria-label={`Обране: ${favorites.length}`}
      aria-pressed={favoritesOnly}
      onClick={() => {
        setFavoritesOnly(!favoritesOnly);
        setQuery("");
        showRecommendations();
      }}
    >
      <HomeIcon name="heart" />
      {favorites.length > 0 && (
        <span className={headerStyles.favoriteCount}>{favorites.length}</span>
      )}
    </button>
  );
}

export function HomeProductCards() {
  const {
    query,
    setQuery,
    favorites,
    toggleFavorite,
    favoritesOnly,
    setFavoritesOnly,
  } = useSelection();
  const normalizedQuery = query.trim().toLocaleLowerCase("uk");
  const products = homeRecommendations.filter(
    (product) =>
      `${product.brand} ${product.title}`
        .toLocaleLowerCase("uk")
        .includes(normalizedQuery) &&
      (!favoritesOnly || favorites.includes(product.id)),
  );

  return (
    <div className={styles.productResults}>
      <p className="visually-hidden" role="status">
        {query || favoritesOnly ? `Знайдено товарів: ${products.length}` : ""}
      </p>
      {products.length ? (
        <div className={styles.productGrid}>
          {products.map((product) => (
            <article key={product.id} className={styles.productCard}>
              <button
                className={styles.productFavorite}
                type="button"
                aria-pressed={favorites.includes(product.id)}
                aria-label={`${favorites.includes(product.id) ? "Прибрати з обраного" : "Додати до обраного"}: ${product.brand}`}
                onClick={() => toggleFavorite(product.id)}
              >
                <HomeIcon name="heart" />
              </button>
              <Link href={product.href} className={styles.productLink}>
                <div className={styles.productImage}>
                  <ReferenceArtwork window={product.artwork} />
                </div>
                <h3>{product.brand}</h3>
                <p>{product.title}</p>
                <strong>{product.price}</strong>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyResults}>
          <HomeIcon name={favoritesOnly ? "heart" : "search"} />
          <p>
            {favoritesOnly
              ? "Зберігайте те, що сподобалось, натиснувши на сердечко."
              : "У цій добірці нічого не знайшлося. Спробуйте іншу назву."}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFavoritesOnly(false);
            }}
          >
            Показати всі рекомендації <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
