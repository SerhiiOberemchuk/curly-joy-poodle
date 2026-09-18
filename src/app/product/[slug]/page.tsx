import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartForm } from "@/features/cart/components/add-to-cart-form";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { getProduct, getProductCategory, getProductSlugs, getRelatedProducts } from "@/features/catalog/queries";
import styles from "./product.module.css";

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  return { title: product.title, description: product.summary };
}

export default async function Page({ params }: PageProps<"/product/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const [category, related] = await Promise.all([
    getProductCategory(product.slug),
    getRelatedProducts(product.slug),
  ]);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Шлях до товару">
        <Link href="/">Головна</Link><span aria-hidden="true">/</span>
        <Link href="/catalog">Каталог</Link>
        {category ? <><span aria-hidden="true">/</span><Link href={`/catalog/${category.slug}`}>{category.title}</Link></> : null}
      </nav>
      <div className={styles.layout}>
        <div>
          <ProductGallery images={product.images} />
          <p className={styles.note}>Для щасливих хвостиків <span>♡</span></p>
        </div>
        <section className={styles.info} aria-labelledby="product-title">
          <p className={styles.line}>{product.brand}{product.line ? ` · ${product.line}` : ""}</p>
          <h1 className={styles.title} id="product-title">{product.title}</h1>
          <p className={styles.summary}>{product.summary}</p>
          <div className={styles.badges}>
            {product.badges.map((badge) => <span key={badge}>{badge}</span>)}
          </div>
          <AddToCartForm productId={product.id} variants={product.variants} />
          <div className={styles.shipping}>
            <Link href="/info/delivery"><strong>Доставка</strong><span>Способи та умови відправлення ↗</span></Link>
            <Link href="/info/returns"><strong>Не підійшов розмір?</strong><span>Допоможемо з обміном ↗</span></Link>
          </div>
        </section>
      </div>
      <section className={styles.details} aria-label="Деталі товару">
        <div><h2 className={styles.detailTitle}>Більше про цю річ</h2><p className={styles.description}>{product.description}</p></div>
        <div><h2 className={styles.detailTitle}>За що любимо</h2><ul className={styles.list}>{product.features.map((item) => <li className={styles.listItem} key={item}>{item}</li>)}</ul></div>
        <div><h2 className={styles.detailTitle}>Як доглядати</h2><ul className={styles.list}>{product.care.map((item) => <li className={styles.listItem} key={item}>{item}</li>)}</ul></div>
      </section>
      {related.length ? <section className={styles.related}><h2>Ще трохи радості</h2><ProductGrid products={related} /></section> : null}
    </div>
  );
}
