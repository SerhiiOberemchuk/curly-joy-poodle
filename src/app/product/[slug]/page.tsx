import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { AddToCartForm } from "@/features/cart/components/add-to-cart-form";
import { ProductGallery, ProductGallerySkeleton } from "@/features/catalog/components/product-gallery";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { getCurrentProduct, getProduct, getProductCategory, getProductSlugs, getRelatedProducts } from "@/features/catalog/queries";
import { productJsonLd, serializeJsonLd } from "@/features/catalog/structured-data";
import type { Product } from "@/features/catalog/types";

import styles from "./product.module.css";

/** Cache Components needs at least one param; an empty catalog prerenders a 404. */
const EMPTY_CATALOG_SLUG = "__empty__";

type ProductParams = PageProps<"/product/[slug]">["params"];

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return (slugs.length > 0 ? slugs : [EMPTY_CATALOG_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  // An old link from before the product was renamed in the CRM.
  if (product.slug !== slug) permanentRedirect(`/product/${product.slug}`);

  const photo = product.images.find((image) => image.src);
  return {
    title: product.title,
    description: product.summary || undefined,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.title,
      description: product.summary || undefined,
      url: `/product/${product.slug}`,
      ...(photo?.src ? { images: [{ url: photo.src, alt: product.title }] } : {}),
    },
  };
}

async function loadProduct(params: ProductParams): Promise<Product> {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  return product;
}

async function ProductCrumbs({ params }: { params: ProductParams }) {
  const product = await loadProduct(params);
  const category = await getProductCategory(product);

  return (
    <>
      {category ? <li><Link href={`/catalog/${category.slug}`}>{category.title}</Link></li> : null}
      <li aria-current="page">{product.title}</li>
    </>
  );
}

async function ProductPhotos({ params }: { params: ProductParams }) {
  const product = await loadProduct(params);
  return <ProductGallery images={product.images} />;
}

async function ProductSummary({ params }: { params: ProductParams }) {
  // Read purchase availability on navigation, rather than at build/prefetch time.
  await connection();
  const product = await getCurrentProduct((await params).slug);
  if (!product) notFound();

  return (
    <>
      {product.brand ? <p className={styles.line}>{product.brand}</p> : null}
      <h1 className={styles.title} id="product-title">{product.title}</h1>
      <AddToCartForm optionName={product.optionName} variants={product.variants} />
    </>
  );
}

function ReturnsLink({ sized = false }: { sized?: boolean }) {
  return sized ? (
    <Link href="/info/returns"><strong>Не підійшов розмір?</strong><span>Допоможемо з обміном ↗</span></Link>
  ) : (
    <Link href="/info/returns"><strong>Повернення та обмін</strong><span>Умови повернення ↗</span></Link>
  );
}

async function ProductReturnsLink({ params }: { params: ProductParams }) {
  const product = await loadProduct(params);
  return <ReturnsLink sized={product.optionName === "Розмір"} />;
}

async function ProductDetails({ params }: { params: ProductParams }) {
  const product = await loadProduct(params);
  const [category, related] = await Promise.all([
    getProductCategory(product),
    getRelatedProducts(product),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product, category)) }}
      />
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
    </>
  );
}

export default function Page({ params }: PageProps<"/product/[slug]">) {
  return (
    <div className={styles.page}>
      <nav aria-label="Навігаційний ланцюжок">
        <ol className={styles.breadcrumbs}>
          <li><Link href="/">Головна</Link></li>
          <li><Link href="/catalog">Каталог</Link></li>
          <Suspense fallback={null}>
            <ProductCrumbs params={params} />
          </Suspense>
        </ol>
      </nav>
      <div className={styles.layout}>
        <div>
          <Suspense fallback={<ProductGallerySkeleton />}>
            <ProductPhotos params={params} />
          </Suspense>
          <p className={styles.note}>Для щасливих хвостиків <span aria-hidden="true">♡</span></p>
        </div>
        <section className={styles.info} aria-labelledby="product-title">
          <Suspense fallback={<div className={styles.summarySkeleton} />}>
            <ProductSummary params={params} />
          </Suspense>
          <div className={styles.shipping}>
            <Link href="/info/delivery"><strong>Доставка</strong><span>Способи та умови відправлення ↗</span></Link>
            <Suspense fallback={<ReturnsLink />}>
              <ProductReturnsLink params={params} />
            </Suspense>
          </div>
        </section>
      </div>
      <Suspense fallback={null}>
        <ProductDetails params={params} />
      </Suspense>
    </div>
  );
}
