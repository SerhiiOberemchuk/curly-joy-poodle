import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { findInfoPage, infoPages, type InfoPage } from "@/content/info-pages";
import { sizeGuide } from "@/content/size-guide";
import { getDisplayCartTerms } from "@/features/checkout/cart-terms.server";
import { openGraph } from "@/lib/metadata";
import { formatMoney } from "@/lib/money";
import { site } from "@/lib/site";

import styles from "./info.module.css";

type InfoParams = PageProps<"/info/[slug]">["params"];

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

async function loadInfoPage(params: InfoParams): Promise<InfoPage> {
  const page = findInfoPage((await params).slug);
  if (!page) notFound();
  return page;
}

async function InfoHero({ params }: { params: InfoParams }) {
  const page = await loadInfoPage(params);

  return (
    <>
      <h1 className={styles.title}>{page.title}</h1>
      <p className={styles.intro}>{page.intro}</p>
    </>
  );
}

async function InfoBlocks({ params }: { params: InfoParams }) {
  const page = await loadInfoPage(params);
  const sizes = page.showSizeTable ? sizeGuide : [];
  const deliveryTerms = page.slug === "delivery"
    ? await getDisplayCartTerms().catch(() => null)
    : null;
  const freeShippingThreshold = deliveryTerms?.freeShippingThreshold ?? null;

  return (
    <>
      {page.blocks.map((block) => (
        <section className={styles.block} key={block.heading}>
          <h2 className={styles.heading}>{block.heading}</h2>
          {page.slug === "delivery" && block.heading === "Безкоштовна доставка" && freeShippingThreshold !== null ? (
            <p className={styles.paragraph}>
              {freeShippingThreshold === 0
                ? "Безкоштовна доставка для всіх замовлень."
                : `Безкоштовна доставка від ${formatMoney(freeShippingThreshold)} суми товарів.`}{" "}
              Підсумок покажемо в кошику перед оформленням.
            </p>
          ) : (
            block.paragraphs?.map((paragraph) => <p className={styles.paragraph} key={paragraph}>{paragraph}</p>)
          )}
          {page.slug === "delivery" && block.heading === "Безкоштовна доставка" && deliveryTerms?.minOrderAmount ? (
            <p className={styles.paragraph}>
              Мінімальна сума замовлення — {formatMoney(deliveryTerms.minOrderAmount)}.
            </p>
          ) : null}
          {block.list ? <ul className={styles.list}>{block.list.map((item) => <li className={styles.listItem} key={item}>{item}</li>)}</ul> : null}
        </section>
      ))}
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
}

async function ContactsLink({ params }: { params: InfoParams }) {
  const { slug } = await params;
  return slug !== "contacts" ? <Link href="/info/contacts">Усі контакти</Link> : null;
}

// A real 404 for an unknown slug must be decided before the first streamed
// byte, so this page may block navigation.
export const instant = false;

export default async function Page({ params }: PageProps<"/info/[slug]">) {
  if (!findInfoPage((await params).slug)) notFound();
  return (
    <article className={`container ${styles.article}`}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Curly Joy підказує</p>
        <Suspense fallback={<div className={styles.heroSkeleton} />}>
          <InfoHero params={params} />
        </Suspense>
      </header>
      <div className={styles.content}>
        <Suspense fallback={<div className={styles.blocksSkeleton} />}>
          <InfoBlocks params={params} />
        </Suspense>
        <aside className={styles.help}>
          <div><strong>Залишилися запитання?</strong><p className={styles.helpText}>{site.workingHours}</p></div>
          <div className={styles.helpLinks}>
            <a href={site.phoneHref}>{site.phone}</a><a href={`mailto:${site.email}`}>{site.email}</a>
            <Suspense fallback={null}>
              <ContactsLink params={params} />
            </Suspense>
          </div>
        </aside>
      </div>
    </article>
  );
}
