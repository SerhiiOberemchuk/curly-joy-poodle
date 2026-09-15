import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { getSizeGuide } from "@/features/catalog/queries";
import { findInfoPage, infoPages } from "@/content/info-pages";
import { site } from "@/lib/site";

import styles from "./info.module.css";

export function generateStaticParams() {
  return infoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = findInfoPage(slug);
  if (!page) return {};

  return { title: page.title, description: page.intro };
}

export default function InfoPage({ params }: PageProps<"/info/[slug]">) {
  return (
    <Suspense fallback={<Section />}>
      <InfoContent params={params} />
    </Suspense>
  );
}

async function InfoContent({ params }: Pick<PageProps<"/info/[slug]">, "params">) {
  const { slug } = await params;
  const page = findInfoPage(slug);
  if (!page) notFound();

  return (
    <Section>
      <article className={styles.article}>
        <h1>{page.title}</h1>
        <p className={styles.intro}>{page.intro}</p>

        {page.blocks.map((block) => (
          <section key={block.heading} className={styles.block}>
            <h2 className={styles.heading}>{block.heading}</h2>

            {block.paragraphs?.map((paragraph) => (
              <p key={paragraph} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}

            {block.list ? (
              <ul className={styles.list}>
                {block.list.map((item) => (
                  <li key={item} className={styles.listItem}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {page.showSizeTable ? <SizeTable /> : null}

        <div className={styles.help}>
          <p className={styles.helpText}>
            Залишились питання? Телефонуйте {site.phone} — {site.workingHours}.
          </p>
          <Link href="/catalog" className={buttonStyles({ variant: "secondary" })}>
            До каталогу
          </Link>
        </div>
      </article>
    </Section>
  );
}

async function SizeTable() {
  const rows = await getSizeGuide();

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">Таблиця розмірів GF Pet</caption>
        <thead>
          <tr>
            <th scope="col">Розмір</th>
            <th scope="col">Довжина спини, см</th>
            <th scope="col">Обхват грудей, см</th>
            <th scope="col">Орієнтовні породи</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code}>
              <th scope="row" className={styles.sizeCode}>
                {row.code}
              </th>
              <td>
                {row.backLengthCm[0]}–{row.backLengthCm[1]}
              </td>
              <td>
                {row.chestCm[0]}–{row.chestCm[1]}
              </td>
              <td className={styles.breeds}>{row.breeds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
