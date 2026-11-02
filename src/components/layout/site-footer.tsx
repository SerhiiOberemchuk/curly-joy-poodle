import Image from "next/image";
import Link from "next/link";

import { businessNavLink, infoNav } from "@/lib/navigation";
import { paymentMarks, site } from "@/lib/site";

import styles from "./site-footer.module.css";
import { NewTabNote } from "@/components/ui/new-tab-note";

export function SiteFooter() {
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
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link
              href="/"
              aria-label="Curly Joy — головна"
              className={styles.brandLogo}
            >
              <Image
                src="/images/brand/logo-brand-clean.png"
                alt=""
                width={1024}
                height={1024}
              />
            </Link>
            <p className={styles.brandText}>
              Речі, історії та маленькі відкриття для щасливого життя разом із
              собакою.
            </p>
            <p className={styles.slogan} lang="en">
              Happy dogs. Happier people. <span aria-hidden="true">♡</span>
            </p>
          </div>

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
              <li>
                <Link href={businessNavLink.href}>{businessNavLink.label}</Link>
              </li>
            </ul>
          </nav>

          <address className={styles.contacts}>
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
                Відповідаємо в робочий час
              </li>
              <li className={styles.contactItem}>{site.address}</li>
            </ul>
            <ul className={styles.socials} aria-label="Ми в соцмережах">
              {site.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    className={styles.social}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {social.label}
                    <NewTabNote />
                  </a>
                </li>
              ))}
            </ul>
          </address>
        </div>

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>© {site.legalName}, 2026</span>
            <span>
              {site.legal.short} · РНОКПП {site.legal.taxId} ·{" "}
              <Link href="/info/terms">реквізити</Link>
            </span>
          </div>
          <ul className={styles.payments} aria-label="Способи оплати">
            {paymentMarks.map((mark) => (
              <li key={mark.label} className={styles.payment}>
                {mark.src ? (
                  <Image
                    src={mark.src}
                    alt={mark.label}
                    width={mark.width ?? 72}
                    height={mark.height ?? 24}
                  />
                ) : (
                  mark.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
