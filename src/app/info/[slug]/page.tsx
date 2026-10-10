import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { findInfoPage, infoPages, type InfoPage } from "@/content/info-pages";
import { sizeGuide } from "@/content/size-guide";
import { site } from "@/lib/site";

import styles from "./info.module.css";

type InfoParams = PageProps<"/info/[slug]">["params"];

export function generateStaticParams() {
  return infoPages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = findInfoPage(slug);
  return page ? { title: page.title, description: page.intro } : { title: "Сторінку не знайдено" };
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

  return (
    <>
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

export default function Page({ params }: PageProps<"/info/[slug]">) {
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
