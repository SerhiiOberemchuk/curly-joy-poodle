import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import {
  CartIndicator,
  CartIndicatorFallback,
} from "@/features/cart/components/cart-indicator";
import { getDisplayCartTerms } from "@/features/checkout/cart-terms.server";
import { getCustomerAccountUrl } from "@/features/customer-account/queries";
import { formatMoney } from "@/lib/money";
import { headerNav, upcomingNav, type NavLink } from "@/lib/navigation";
import { site } from "@/lib/site";

import { Icon } from "@/components/ui/icon";

import { FavoritesLink } from "./favorites-link";
import styles from "./site-header.module.css";
import { SiteSearch } from "./site-search";
import { StickyHeader } from "./sticky-header";

const mobileLinks: readonly NavLink[] = [
  { href: "/catalog", label: "Каталог" },
  ...headerNav,
];

const accountLabel = "Особистий кабінет";
const deliveryFallback = "Доставка Новою поштою по всій Україні";

/**
 * The buyer account lives in the CRM, on the shop's own address. Shown only
 * while the CRM says it is open; if the CRM cannot be asked, the header simply
 * goes without it — the rest of the page still renders.
 */
async function AccountAction() {
  const url = await getCustomerAccountUrl();
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
  const url = await getCustomerAccountUrl();
  return (
    <MobileNav
      links={mobileLinks}
      upcoming={upcomingNav}
      account={url ? { href: url, label: accountLabel } : null}
    />
  );
}

/** The CRM's free-shipping threshold: the shop's standing offer. */
async function DeliveryOffer() {
  // Cached for 30 s, too short for a prerender: read at request time.
  await connection();
  const threshold =
    (await getDisplayCartTerms().catch(() => null))?.freeShippingThreshold ??
    null;
  if (threshold === null) return deliveryFallback;
  return threshold === 0
    ? "Безкоштовна доставка для всіх замовлень"
    : `Безкоштовна доставка від ${formatMoney(threshold)}`;
}

export function SiteHeader() {
  return (
    <StickyHeader
      topbar={
        <>
          <p className={styles.topbarOffer}>
            <Icon name="truck" />
            <Suspense fallback={deliveryFallback}>
              <DeliveryOffer />
            </Suspense>
          </p>
          <p className={styles.topbarContacts}>
            <span>
              <Icon name="clock" />
              {site.workingHours}
            </span>
            <a href={site.phoneHref}>
              <Icon name="phone" />
              {site.phone}
            </a>
          </p>
        </>
      }
    >
      <div className={styles.mobileMenu}>
        <Suspense
          fallback={<MobileNav links={mobileLinks} upcoming={upcomingNav} />}
        >
          <MobileMenu />
        </Suspense>
      </div>
      <nav className={styles.navigation} aria-label="Головне меню">
        <Link className={styles.catalogButton} href="/catalog">
          Каталог
        </Link>
        {headerNav.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        {upcomingNav.map((label) => (
          <span key={label} className={styles.upcoming}>
            {label}
            <span className={styles.soonTag}>скоро</span>
          </span>
        ))}
      </nav>
      <Link className={styles.logo} href="/" aria-label="Curly Joy — головна">
        <Image
          src="/images/brand/logo-brand-clean.png"
          alt=""
          width={1024}
          height={1024}
          className={styles.logoArtwork}
          loading="eager"
          sizes="(width <= 1100px) 56px, 136px"
        />
        <span lang="en">Happy dogs. Happier people.</span>
      </Link>
      <div className={styles.headerActions}>
        <SiteSearch />
        <Suspense fallback={null}>
          <AccountAction />
        </Suspense>
        <FavoritesLink />
        <Suspense fallback={<CartIndicatorFallback />}>
          <CartIndicator />
        </Suspense>
      </div>
      <Link className={styles.mobileCatalog} href="/catalog">
        Каталог товарів
        <Icon name="arrow" />
      </Link>
    </StickyHeader>
  );
}
