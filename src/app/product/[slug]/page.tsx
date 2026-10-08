import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { AddToCartForm } from "@/features/cart/components/add-to-cart-form";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { getProduct, getProductCategory, getProductSlugs, getRelatedProducts } from "@/features/catalog/queries";
import styles from "./product.module.css";

/** Cache Components needs at least one param; an empty catalog prerenders a 404. */
const EMPTY_CATALOG_SLUG = "__empty__";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return (slugs.length > 0 ? slugs : [EMPTY_CATALOG_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  return {
    title: product.title,
    description: product.summary || undefined,
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function Page({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  // An old link from before the product was renamed in the CRM.
  if (product.slug !== slug) permanentRedirect(`/product/${product.slug}`);

  const [category, related] = await Promise.all([
    getProductCategory(product),
    getRelatedProducts(product),
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
          {product.brand ? <p className={styles.line}>{product.brand}</p> : null}
          <h1 className={styles.title} id="product-title">{product.title}</h1>
          <AddToCartForm optionName={product.optionName} variants={product.variants} />
          <div className={styles.shipping}>
            <Link href="/info/delivery"><strong>Доставка</strong><span>Способи та умови відправлення ↗</span></Link>
            {product.optionName === "Розмір" ? (
              <Link href="/info/returns"><strong>Не підійшов розмір?</strong><span>Допоможемо з обміном ↗</span></Link>
            ) : (
              <Link href="/info/returns"><strong>Повернення та обмін</strong><span>Умови повернення ↗</span></Link>
            )}
          </div>
        </section>
      </div>
      {product.descriptionHtml || product.attributes.length > 0 ? (
        <section className={styles.details} aria-label="Деталі товару">
          {product.descriptionHtml ? (
            <div>
              <h2 className={styles.detailTitle}>Більше про цю річ</h2>
              {/* Sanitized in catalog-source: p/br/ul/ol/li/strong only, no attributes. */}
              <div className={styles.description} dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
            </div>
          ) : null}
          {product.attributes.length > 0 ? (
            <div>
              <h2 className={styles.detailTitle}>Характеристики</h2>
              <dl className={styles.list}>
                {product.attributes.map((attribute) => (
                  <div className={styles.listItem} key={attribute.name}>
                    <dt>{attribute.name}:</dt>
                    <dd>{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </section>
      ) : null}
      {related.length ? <section className={styles.related}><h2>Ще трохи радості</h2><ProductGrid products={related} /></section> : null}
    </div>
  );
}
