import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import {
  CartIndicator,
  CartIndicatorFallback,
} from "@/features/cart/components/cart-indicator";
import { getCustomerAccountUrl } from "@/features/customer-account/queries";
import { headerNav, type NavLink } from "@/lib/navigation";

import { Icon } from "@/components/ui/icon";

import { FavoritesLink } from "./favorites-link";
import styles from "./site-header.module.css";
import { SiteSearch } from "./site-search";

const businessLink: NavLink = {
  href: "/business",
  label: "Для бізнесу (B2B)",
};

const mobileLinks: readonly NavLink[] = [
  { href: "/catalog", label: "Каталог" },
  ...headerNav,
  businessLink,
];

const accountLabel = "Особистий кабінет";

/**
 * The buyer account lives in the CRM, on the shop's own address. Shown only
 * while the CRM says it is open; if the CRM cannot be asked, the header simply
 * goes without it — the rest of the page still renders.
 */
async function readAccountUrl(): Promise<string | null> {
  try {
    return await getCustomerAccountUrl();
  } catch {
    return null;
  }
}

async function AccountAction() {
  const url = await readAccountUrl();
  if (!url) return null;
  return (
    <a
      className={`${styles.iconButton} ${styles.tooltipAction}`}
      href={url}
      aria-label={accountLabel}
    >
      <Icon name="user" />
      <span className={styles.actionTooltip}>{accountLabel}</span>
    </a>
  );
}

async function MobileMenu() {
  const url = await readAccountUrl();
  return (
    <MobileNav
      links={mobileLinks}
      account={url ? { href: url, label: accountLabel } : null}
    />
  );
}

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
            <Icon name="menu" />
            Каталог
          </Link>
          {headerNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className={styles.logo} href="/" aria-label="Curly Joy — головна">
          <Image
            src="/logo_brand.jpg"
            alt=""
            width={1024}
            height={1024}
            className={styles.logoArtwork}
            priority
          />
          <span lang="en">Happy dogs. Happier people.</span>
        </Link>
        <div className={styles.headerActions}>
          <SiteSearch />
          <Link
            className={`${styles.iconButton} ${styles.tooltipAction}`}
            href={businessLink.href}
            aria-label={businessLink.label}
          >
            <Icon name="briefcase" />
            <span className={styles.actionTooltip}>{businessLink.label}</span>
          </Link>
          <Suspense fallback={null}>
            <AccountAction />
          </Suspense>
          <FavoritesLink />
          <Suspense fallback={<CartIndicatorFallback />}>
            <CartIndicator />
          </Suspense>
          <div className={styles.mobileMenu}>
            <Suspense fallback={<MobileNav links={mobileLinks} />}>
              <MobileMenu />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
