import Image from "next/image";
import Link from "next/link";

import { getCategories } from "@/features/catalog/queries";
import { infoNav } from "@/lib/navigation";
import { site } from "@/lib/site";

import styles from "./site-footer.module.css";

export async function SiteFooter() {
  const categories = await getCategories();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <Link href="/" aria-label="Curly Joy — головна">
              <Image
                src="/images/reference/6a1aff045a3e6e89b6f86151.webp"
                alt="Curly Joy"
                width={92}
                height={92}
                className={styles.brandLogo}
              />
            </Link>
            <p className={styles.brandText}>
              Речі, історії та маленькі відкриття для щасливого життя разом із
              собакою.
            </p>
            <div className={styles.socials}>
              {site.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className={styles.social}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <nav aria-labelledby="footer-catalog">
            <p className={styles.columnTitle} id="footer-catalog">
              Каталог
            </p>
            <ul className={styles.list}>
              <li>
                <Link href="/catalog">Усі товари</Link>
              </li>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/catalog/${category.slug}`}>
                    {category.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-info">
            <p className={styles.columnTitle} id="footer-info">
              Покупцям
            </p>
            <ul className={styles.list}>
              <li>
                <Link href="/info/sizes">Як виміряти собаку</Link>
              </li>
              {infoNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={styles.columnTitle}>Контакти</p>
            <ul className={styles.list}>
              <li className={styles.contactItem}>
                <a href={site.phoneHref}>
                  <strong>{site.phone}</strong>
                </a>
                {site.workingHours}
              </li>
              <li className={styles.contactItem}>
                <a href={`mailto:${site.email}`}>
                  <strong>{site.email}</strong>
                </a>
                Відповідаємо протягом робочого дня
              </li>
              <li className={styles.contactItem}>{site.address}</li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© {site.legalName}, 2026</span>
          <span>Оплата карткою Visa / Mastercard та накладений платіж</span>
        </div>
      </div>
    </footer>
  );
}
