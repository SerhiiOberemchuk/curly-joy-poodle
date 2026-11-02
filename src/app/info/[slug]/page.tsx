import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { findInfoPage, infoPages, type InfoPage } from "@/content/info-pages";
import { sizeGuide } from "@/content/size-guide";
import { getDisplayCartTerms } from "@/features/checkout/cart-terms.server";
import { openGraph } from "@/lib/metadata";
import { formatMoney } from "@/lib/money";
import { site } from "@/lib/site";

import styles from "./info.module.css";

export function generateStaticParams() {
  return infoPages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = findInfoPage(slug);
  if (!page) notFound();
  return {
    title: page.title,
    description: page.intro,
    alternates: { canonical: `/info/${page.slug}` },
    openGraph: openGraph({
      title: page.title,
      description: page.intro,
      url: `/info/${page.slug}`,
    }),
    ...(page.draft ? { robots: { index: false, follow: true } } : {}),
  };
}

/** The CRM's current free-shipping and minimum-order figures, in the shop's words. */
async function FreeShippingTerms({ fallback }: { fallback: ReactNode }) {
  // The terms are cached for 30 s, too short for a prerender: read at request time.
  await connection();
  const terms = await getDisplayCartTerms().catch(() => null);
  const threshold = terms?.freeShippingThreshold ?? null;
  return (
    <>
      {threshold === null ? fallback : (
        <p className={styles.paragraph}>
          {threshold === 0
            ? "Безкоштовна доставка для всіх замовлень."
            : `Безкоштовна доставка від ${formatMoney(threshold)} суми товарів.`}{" "}
          Підсумок покажемо в кошику перед оформленням.
        </p>
      )}
      {terms?.minOrderAmount ? (
        <p className={styles.paragraph}>
          Мінімальна сума замовлення — {formatMoney(terms.minOrderAmount)}.
        </p>
      ) : null}
    </>
  );
}

function InfoBlocks({ page }: { page: InfoPage }) {
  const sizes = page.showSizeTable ? sizeGuide : [];

  const content = (
    <>
      {page.blocks.map((block) => {
        const paragraphs = block.paragraphs?.map((paragraph) => (
          <p className={styles.paragraph} key={paragraph}>{paragraph}</p>
        ));
        return (
          <section className={styles.block} key={block.heading}>
            <h2 className={styles.heading}>{block.heading}</h2>
            {page.slug === "delivery" && block.heading === "Безкоштовна доставка" ? (
              // The general wording until the CRM's figures arrive.
              <Suspense fallback={paragraphs}>
                <FreeShippingTerms fallback={paragraphs} />
              </Suspense>
            ) : (
              paragraphs
            )}
            {block.list ? <ul className={styles.list}>{block.list.map((item) => <li className={styles.listItem} key={item}>{item}</li>)}</ul> : null}
          </section>
        );
      })}
      {sizes.length > 0 ? (
        <section className={styles.block}>
          <h2 className={styles.heading}>Таблиця розмірів GF Pet</h2>
          <p className={styles.paragraph}>Орієнтуйтеся насамперед на обхват грудей. Порода в таблиці — лише підказка.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>Розміри одягу GF Pet у сантиметрах</caption>
              <thead><tr><th scope="col">Розмір</th><th scope="col">Спина, см</th><th scope="col">Груди, см</th><th scope="col">Орієнтовні породи</th></tr></thead>
              <tbody>{sizes.map((size) => <tr key={size.code}><th scope="row" className={styles.sizeCode}>{size.code}</th><td>{size.backLengthCm.join("–")}</td><td>{size.chestCm.join("–")}</td><td className={styles.breeds}>{size.breeds}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
  // A section still being prepared reads as one notice, not a finished page.
  return page.draft ? (
    <div className={styles.draft}>
      <p className={styles.draftTag}>Розділ готуємо</p>
      {content}
    </div>
  ) : (
    content
  );
}

// A real 404 for an unknown slug must be decided before the first streamed
// byte, so this page may block navigation. The content is the shop's own and
// is part of the prerendered page.
export const instant = false;

export default async function Page({ params }: PageProps<"/info/[slug]">) {
  const page = findInfoPage((await params).slug);
  if (!page) notFound();
  return (
    <article className={`container ${styles.article}`}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Curly Joy підказує</p>
        <h1 className={styles.title}>{page.title}</h1>
        <p className={styles.intro}>{page.intro}</p>
      </header>
      <div className={styles.content}>
        <InfoBlocks page={page} />
        <aside className={styles.help}>
          <div><strong>Залишилися запитання?</strong><p className={styles.helpText}>{site.workingHours}</p></div>
          <div className={styles.helpLinks}>
            <a href={site.phoneHref}>{site.phone}</a><a href={`mailto:${site.email}`}>{site.email}</a>
            {page.slug !== "contacts" ? <Link href="/info/contacts">Усі контакти</Link> : null}
          </div>
        </aside>
      </div>
    </article>
  );
}
