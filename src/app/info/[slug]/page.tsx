import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findInfoPage, infoPages } from "@/content/info-pages";
import { getSizeGuide } from "@/features/catalog/queries";
import { site } from "@/lib/site";

import styles from "./info.module.css";

export function generateStaticParams() {
  return infoPages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = findInfoPage(slug);
  return page ? { title: page.title, description: page.intro } : { title: "Сторінку не знайдено" };
}

export default async function Page({ params }: PageProps<"/info/[slug]">) {
  const { slug } = await params;
  const page = findInfoPage(slug);
  if (!page) notFound();
  const sizes = page.showSizeTable ? await getSizeGuide() : [];

  return (
    <article className={`container ${styles.article}`}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Curly Joy підказує</p>
        <h1 className={styles.title}>{page.title}</h1>
        <p className={styles.intro}>{page.intro}</p>
      </header>
      <div className={styles.content}>
        {page.blocks.map((block) => (
          <section className={styles.block} key={block.heading}>
            <h2 className={styles.heading}>{block.heading}</h2>
            {block.paragraphs?.map((paragraph) => <p className={styles.paragraph} key={paragraph}>{paragraph}</p>)}
            {block.list ? <ul className={styles.list}>{block.list.map((item) => <li className={styles.listItem} key={item}>{item}</li>)}</ul> : null}
          </section>
        ))}
        {sizes.length > 0 ? (
          <section className={styles.block}>
            <h2 className={styles.heading}>Таблиця розмірів GF Pet</h2>
            <p className={styles.paragraph}>Орієнтуйтеся насамперед на обхват грудей. Порода в таблиці — лише підказка.</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Розмір</th><th>Спина, см</th><th>Груди, см</th><th>Орієнтовні породи</th></tr></thead>
                <tbody>{sizes.map((size) => <tr key={size.code}><td className={styles.sizeCode}>{size.code}</td><td>{size.backLengthCm.join("–")}</td><td>{size.chestCm.join("–")}</td><td className={styles.breeds}>{size.breeds}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        ) : null}
        <aside className={styles.help}>
          <div><strong>Залишилися запитання?</strong><p className={styles.helpText}>{site.workingHours}</p></div>
          <div className={styles.helpLinks}>
            <a href={site.phoneHref}>{site.phone}</a><a href={`mailto:${site.email}`}>{site.email}</a>
            {slug !== "contacts" ? <Link href="/info/contacts">Усі контакти</Link> : null}
          </div>
        </aside>
      </div>
    </article>
  );
}
