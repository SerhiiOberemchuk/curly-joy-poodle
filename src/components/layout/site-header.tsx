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
      <div className={styles.announcement}>
        Для собак. Для їхніх людей. Для життя разом.
      </div>
      <div className={styles.bar}>
        <Link href="/" className={styles.logo} aria-label="Curly Joy — головна">
          <Image
            src="/images/reference/6a1aff045a3e6e89b6f86151.webp"
            alt="Curly Joy"
            width={58}
            height={58}
          />
          <span className={styles.wordmark}>
            Curly Joy<span>щасливі бути разом</span>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Головне меню">
          <Link href="/catalog" className={styles.navLink}>
            Каталог
          </Link>
          <Link href="/#moments" className={styles.navLink}>
            Добірки для життя
          </Link>
          <Link href="/#recommendations" className={styles.navLink}>
            Curly Joy рекомендує
          </Link>
          <Link href="/#story" className={styles.navLink}>
            Про нас
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
