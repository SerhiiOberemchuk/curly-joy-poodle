import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import {
  CartIndicator,
  CartIndicatorFallback,
} from "@/features/cart/components/cart-indicator";
import { primaryNav } from "@/lib/navigation";

import { MobileNav } from "./mobile-nav";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.logo} aria-label="Curly Joy — головна">
          <Image
            src="/images/reference/6a1aff045a3e6e89b6f86151.webp"
            alt="Curly Joy"
            width={58}
            height={58}
            preload
          />
        </Link>
        <nav className={styles.nav} aria-label="Головне меню">
          <Link href="/catalog" className={styles.navLink}>
            Категорії
          </Link>
          <Link href="/info/sizes" className={styles.navLink}>
            Як виміряти
          </Link>
        </nav>
        <div className={styles.actions}>
          <Suspense fallback={<CartIndicatorFallback />}>
            <CartIndicator />
          </Suspense>
          <MobileNav links={primaryNav} />
        </div>
      </div>
    </header>
  );
}
