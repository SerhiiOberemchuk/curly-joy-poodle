import Link from "next/link";
import { Suspense } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import {
  CartIndicator,
  CartIndicatorFallback,
} from "@/features/cart/components/cart-indicator";
import { site } from "@/lib/site";

import styles from "./site-header.module.css";
import {
  HomeFavorites,
  HomeSearch,
} from "@/features/home/components/home-interactions";
import { HomeIcon } from "@/features/home/components/home-icon";
import { ReferenceArtwork } from "@/features/home/components/reference-artwork";

const navigation = [
  { href: "/#story", label: "Про нас" },
  { href: "/#recommendations", label: "Curly Joy рекомендує" },
  { href: "/info/blog", label: "Блог" },
  { href: "/info/events", label: "Події" },
  {
    href: `mailto:${site.email}?subject=Співпраця%20B2B`,
    label: "Для бізнесу (B2B)",
  },
] as const;

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.topbar}>
        <span className={styles.languages}>
          <span aria-label="Українська мова">UA</span>
          <span aria-hidden="true">|</span>
          <span
            className={styles.futureLanguage}
            title="Англійська версія з’явиться пізніше"
            lang="en"
          >
            EN
          </span>
        </span>
        <span className={styles.goodDay} lang="en">
          Good day <span>♡</span>
        </span>
      </div>
      <div className={styles.headerBar}>
        <nav className={styles.navigation} aria-label="Головне меню">
          <Link className={styles.catalogButton} href="/catalog">
            <HomeIcon name="menu" />
            Каталог
          </Link>
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className={styles.logo} href="/" aria-label="Curly Joy — головна">
          <ReferenceArtwork
            window={[467, 15, 95, 83]}
            className={styles.logoArtwork}
          />
          <span lang="en">Happy dogs. Happier people.</span>
        </Link>
        <div className={styles.headerActions}>
          <HomeSearch />
          <details className={styles.account}>
            <summary
              className={styles.iconButton}
              aria-label="Особистий кабінет"
            >
              <HomeIcon name="user" />
            </summary>
            <div className={styles.accountPanel}>
              <strong>Раді знайомству!</strong>
              <p>Особистий кабінет з’явиться пізніше.</p>
              <Link href="/cart">
                Перейти до кошика <span aria-hidden="true">→</span>
              </Link>
            </div>
          </details>
          <HomeFavorites />
          <Suspense fallback={<CartIndicatorFallback />}>
            <CartIndicator />
          </Suspense>
          <div className={styles.mobileMenu}>
            <MobileNav
              links={[{ href: "/catalog", label: "Каталог" }, ...navigation]}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
