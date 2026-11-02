import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Icon } from "@/components/ui/icon";
import { FavoriteToggle } from "@/features/favorites/favorites";
import { ProductReviews } from "@/features/reviews/components/product-reviews";
import { ReviewStars } from "@/features/reviews/components/review-stars";
import {
  getPublishedReviews,
  getReviewSummary,
  modelKeyOf,
  ratingFromSummaries,
  REVIEWS_PER_PAGE,
} from "@/features/reviews/crm-reviews";
import { getDisplayCartTerms } from "@/features/checkout/cart-terms.server";
import { openGraph } from "@/lib/metadata";
import { formatMoney } from "@/lib/money";

import { AddToCartForm } from "@/features/cart/components/add-to-cart-form";
import {
  ProductGallery,
  ProductGallerySkeleton,
} from "@/features/catalog/components/product-gallery";
import { ProductShelf } from "@/features/catalog/components/product-shelf";
import { discountPercent } from "@/features/catalog/pricing";
import {
  getBundleComposition,
  getProduct,
  getProductCategory,
  getProductSlugs,
  getRecentProduct,
  getRelatedProducts,
} from "@/features/catalog/queries";
import {
  productJsonLd,
  serializeJsonLd,
} from "@/features/catalog/structured-data";
import type { Product } from "@/features/catalog/types";

import styles from "./product.module.css";

/** Cache Components needs at least one param; an empty catalog prerenders a 404. */
const EMPTY_CATALOG_SLUG = "__empty__";

type ProductParams = PageProps<"/product/[slug]">["params"];

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return (slugs.length > 0 ? slugs : [EMPTY_CATALOG_SLUG]).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  // An old link from before the product was renamed in the CRM.
  if (product.slug !== slug) permanentRedirect(`/product/${product.slug}`);

  const photo = product.images.find((image) => image.src);
  // A product the merchant left without a summary still gets a real snippet.
  const description =
    product.summary ||
    `${product.title}${product.brand ? ` від ${product.brand}` : ""} у Curly Joy. Доставка Новою поштою по Україні.`;
  return {
    title: product.title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: openGraph({
      title: product.title,
      description,
      url: `/product/${product.slug}`,
      images: photo?.src ? [{ url: photo.src, alt: product.title }] : undefined,
    }),
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
    <Breadcrumbs
      trail={[
        { href: "/catalog", label: "Каталог" },
        ...(category
          ? [{ href: `/catalog/${category.slug}` as const, label: category.title }]
          : []),
      ]}
      current={product.title}
    />
  );
}

async function ProductPhotos({ params }: { params: ProductParams }) {
  const product = await loadProduct(params);
  const discount = Math.max(
    0,
    ...product.variants.map(
      (variant) => discountPercent(variant.price, variant.compareAtPrice) ?? 0,
    ),
  );
  return (
    <ProductGallery
      key={product.id}
      images={product.images}
      videos={product.videos}
      soldOut={!product.variants.some((variant) => variant.inStock)}
      overlay={
        <>
          {discount ? (
            <ul className={styles.galleryBadges} aria-label="Позначки товару">
              <li className={styles.saleBadge}>−{discount}%</li>
            </ul>
          ) : null}
          <FavoriteToggle
            productId={product.id}
            productTitle={product.title}
            className={styles.favorite}
          />
        </>
      }
    />
  );
}

async function ProductReviewLink({ productId }: { productId: string }) {
  const summary = await getReviewSummary(modelKeyOf(productId)).catch(() => null);
  if (!summary?.count) {
    return (
      <a href="#review-form" className={styles.reviewLink}>
        <Icon name="star" />
        Залиште перший відгук
      </a>
    );
  }
  return (
    <a href="#product-reviews" className={styles.reviewLink}>
      <ReviewStars rating={summary.average ?? 0} />
      <span>
        {(summary.average ?? 0).toFixed(1).replace(".", ",")} · {reviewCount(summary.count)}
      </span>
    </a>
  );
}

const reviewCount = (count: number) => {
  const form = new Intl.PluralRules("uk").select(count);
  return `${count} ${form === "one" ? "відгук" : form === "few" ? "відгуки" : "відгуків"}`;
};

async function ProductSummary({ params }: { params: ProductParams }) {
  // Read purchase availability on navigation, rather than at build/prefetch time.
  await connection();
  const { slug } = await params;
  // At most half a minute old, shared by all visitors; if the CRM cannot
  // answer right now, the listing's copy keeps the page usable. Adding to the
  // cart re-checks stock against the CRM either way.
  const product = await getRecentProduct(slug).catch(() => getProduct(slug));
  if (!product) notFound();
  const [category, summary] = await Promise.all([
    getProductCategory(product),
    getReviewSummary(modelKeyOf(product.id)).catch(() => null),
  ]);
  const rating = summary ? ratingFromSummaries([summary]) : null;
  return (
    <>
      {/* Beside the visible price and stock, from the same read, so they agree. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(productJsonLd(product, category, rating)),
        }}
      />
      {product.brand ? <p className={styles.line}>{product.brand}</p> : null}
      <h1 className={styles.title} id="product-title">
        {product.title}
      </h1>
      <Suspense fallback={<a href="#product-reviews" className={styles.reviewLink}>Відгуки</a>}>
        <ProductReviewLink productId={product.id} />
      </Suspense>
      {product.summary ? <p className={styles.summary}>{product.summary}</p> : null}
      <AddToCartForm
        title={product.title}
        optionName={product.optionName}
        variants={product.variants}
      />
    </>
  );
}

async function ProductTrust() {
  // The terms are cached for 30 s, too short for a prerender: read at request time.
  await connection();
  const freeFrom =
    (await getDisplayCartTerms().catch(() => null))?.freeShippingThreshold ??
    null;
  return (
    <ul className={styles.trust} aria-label="Доставка, обмін та оплата">
      <li>
        <Link href="/info/delivery">
          <Icon name="truck" />
          <strong>
            {freeFrom !== null
              ? `Безкоштовна доставка${freeFrom > 0 ? ` від ${formatMoney(freeFrom)}` : ""}`
              : "Доставка по Україні"}
          </strong>
          <span>Новою поштою</span>
        </Link>
      </li>
      <li>
        <Link href="/info/returns">
          <Icon name="heart" />
          <strong>14 днів на обмін</strong>
          <span>Умови повернення</span>
        </Link>
      </li>
      <li>
        <Link href="/info/payment">
          <Icon name="shield" />
          <strong>Захищена оплата</strong>
          <span>На стороні банку</span>
        </Link>
      </li>
    </ul>
  );
}

/** The CRM's specifications, in a block of their own under the purchase. */
async function ProductAttributes({ params }: { params: ProductParams }) {
  const product = await loadProduct(params);
  if (product.attributes.length === 0) return null;
  return (
    <section className={styles.attributes} aria-labelledby="attributes-title">
      <h2 id="attributes-title">Характеристики</h2>
      <dl className={styles.attributeList}>
        {product.attributes.map((attribute) => (
          <div className={styles.attribute} key={attribute.name}>
            <dt>{attribute.name}</dt>
            <dd>{attribute.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

async function Reviews({ params, searchParams }: {
  params: ProductParams;
  searchParams: PageProps<"/product/[slug]">["searchParams"];
}) {
  await connection();
  const rawPage = (await searchParams).reviewsPage;
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const product = await loadProduct(params);
  const modelKey = modelKeyOf(product.id);
  const summary = await getReviewSummary(modelKey).catch(() => null);
  // Only pages that exist reach the CRM: each page is a separate cached read.
  const pages = Math.max(1, Math.ceil((summary?.count ?? 0) / REVIEWS_PER_PAGE));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, pages)
    : 1;
  const reviews = await getPublishedReviews(modelKey, page).catch(() => null);
  return (
    <ProductReviews
      productId={product.id}
      productSlug={product.slug}
      requestId={crypto.randomUUID()}
      reviews={reviews?.data ?? []}
      page={page}
      total={reviews?.pagination.total ?? 0}
      summary={summary}
      unavailable={reviews === null || summary === null}
    />
  );
}

async function ProductDetails({ params }: { params: ProductParams }) {
  const product = await loadProduct(params);
  const composition = await getBundleComposition(product).catch(() => null);

  return (
    <>
      {product.descriptionHtml ? (
        <section className={styles.details} aria-labelledby="overview-title">
          <h2 id="overview-title" className={styles.detailTitle}>Огляд</h2>
          {/* Sanitized in catalog-source: p/br/ul/ol/li/strong only, no attributes. */}
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </section>
      ) : null}
      {product.type === "bundle" ? (
        <section className={styles.bundle} aria-labelledby="bundle-title">
          <div className={styles.bundleHeading}>
            <span className={styles.bundleEyebrow}>Разом у наборі</span>
            <h2 id="bundle-title">Склад комплекту</h2>
            <p>Речі, які входять до цього набору.</p>
          </div>
          {composition === null ? (
            <p role="status">Склад комплекту зараз не вдалося завантажити.</p>
          ) : composition.length === 0 ? (
            <p>Склад комплекту ще не вказано в каталозі.</p>
          ) : (
            <ul className={styles.bundleList}>
              {composition.map((item) => (
                <li className={styles.bundleItem} key={item.id}>
                  {item.image ? (
                    <Image src={item.image} alt="" width={88} height={88} />
                  ) : (
                    <span className={styles.bundlePlaceholder} aria-hidden="true">♡</span>
                  )}
                  <div className={styles.bundleItemCopy}>
                    {item.slug ? (
                      <Link href={`/product/${item.slug}`}>{item.title}</Link>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
                    {item.sku ? <span>Артикул: {item.sku}</span> : null}
                  </div>
                  <span className={styles.bundleQuantity}>× {item.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}

async function RelatedProducts({ params }: { params: ProductParams }) {
  const product = await loadProduct(params);
  const related = await getRelatedProducts(product, 12);
  if (related.length === 0) return null;
  return (
    <section className={styles.related} aria-labelledby="related-title">
      <h2 id="related-title">Ще трохи радості</h2>
      <ProductShelf products={related} label="Рекомендовані товари" />
    </section>
  );
}

// A real 404 for an unknown slug and a 308 for a renamed product must be
// decided before the first streamed byte, so this page may block navigation.
export const instant = false;

export default async function Page({ params, searchParams }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  if (product.slug !== slug) permanentRedirect(`/product/${product.slug}`);
  return (
    <div className={styles.page}>
      <div className={styles.crumbs}>
        <Suspense fallback={null}>
          <ProductCrumbs params={params} />
        </Suspense>
      </div>
      <div className={styles.layout}>
        <div className={styles.galleryColumn}>
          <Suspense fallback={<ProductGallerySkeleton />}>
            <ProductPhotos params={params} />
          </Suspense>
        </div>
        <div className={styles.buyColumn}>
          <section className={styles.info} aria-labelledby="product-title">
            <Suspense fallback={<div className={styles.summarySkeleton} />}>
              <ProductSummary params={params} />
            </Suspense>
            <Suspense fallback={null}>
              <ProductTrust />
            </Suspense>
          </section>
          <Suspense fallback={null}>
            <ProductAttributes params={params} />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={null}>
        <ProductDetails params={params} />
      </Suspense>
      <Suspense fallback={null}>
        <Reviews params={params} searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <RelatedProducts params={params} />
      </Suspense>
    </div>
  );
}
