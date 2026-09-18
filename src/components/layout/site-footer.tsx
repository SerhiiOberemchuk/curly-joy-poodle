import Image from "next/image";
import Link from "next/link";

import { getCategories } from "@/features/catalog/queries";
import { HomeIcon } from "@/features/home/components/home-icon";
import { infoNav } from "@/lib/navigation";
import { site } from "@/lib/site";

import styles from "./site-footer.module.css";

export async function SiteFooter() {
  const categories = await getCategories();

  return (
    <footer className={styles.footer}>
      <svg
        className={styles.wave}
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 28C150 12 225 0 350 15S555 46 720 24 910 4 1060 18 1310 0 1440 15V48H0Z"
          fill="currentColor"
        />
      </svg>
      <div className={styles.container}>
        <div className={styles.signature}>
          <p className={styles.note} lang="en">
            Happy dogs.
            <br />
            <span>
              Happier people. <b>♡</b>
            </span>
          </p>
          <Link
            href="/"
            className={styles.wordmark}
            aria-label="Curly Joy — головна"
          >
            CURLY JOY
          </Link>
          <div className={styles.pawTrail} aria-hidden="true">
            <HomeIcon name="paw" />
            <HomeIcon name="paw" />
            <HomeIcon name="paw" />
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link
              href="/"
              aria-label="Curly Joy — головна"
              className={styles.brandLogo}
            >
              <Image
                src="/logo_brand.jpg"
                alt=""
                width={1024}
                height={1024}
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
