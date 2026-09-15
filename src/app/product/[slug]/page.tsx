import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Section } from "@/components/ui/section";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid-skeleton";
import {
  getCategory,
  getProduct,
  getProductSlugs,
  getRelatedProducts,
} from "@/features/catalog/queries";
import type { Product } from "@/features/catalog/types";
import { AddToCartForm } from "@/features/cart/components/add-to-cart-form";
import { formatMoney } from "@/lib/money";

import styles from "./product.module.css";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.line ? `${product.title} ${product.line}` : product.title,
    description: product.summary,
    openGraph: { title: product.title, description: product.summary, type: "website" },
  };
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense
      fallback={
        <Section>
          <ProductGridSkeleton count={2} />
        </Section>
      }
    >
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = await getCategory(product.categorySlug);
  const prices = product.variants.map((variant) => variant.price);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);

  return (
    <>
      <div className="container">
        <nav className={styles.breadcrumbs} aria-label="Навігаційний ланцюжок">
          <Link href="/">Головна</Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalog">Каталог</Link>
          {category ? (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/catalog/${category.slug}`}>{category.title}</Link>
            </>
          ) : null}
          <span aria-hidden="true">/</span>
          <span>{product.title}</span>
        </nav>

        <div className={styles.layout}>
          <ProductGallery images={product.images} />

          <div className={styles.info}>
            {product.badges.length > 0 ? (
              <div className={styles.badges}>
                {product.badges.map((badge) => (
                  <Badge key={badge} tone="accent">
                    {badge}
                  </Badge>
                ))}
                <Badge tone="neutral">{product.brand}</Badge>
              </div>
            ) : null}

            {product.line ? <p className={styles.line}>{product.line}</p> : null}
            <h1 className={styles.title}>{product.title}</h1>
            <p className={styles.summary}>{product.summary}</p>

            <div className={styles.priceRow}>
              <Price
                amount={lowest}
                compareAtAmount={product.variants[0].compareAtPrice}
                size="lg"
                prefix={lowest === highest ? undefined : "від"}
              />
            </div>

            <hr className={styles.divider} />

            <AddToCartForm productId={product.id} variants={product.variants} />
          </div>
        </div>

        <div className={styles.details}>
          <div>
            <h2 className={styles.detailTitle}>Опис</h2>
            <p className={styles.description}>{product.description}</p>
          </div>

          <div>
            <h2 className={styles.detailTitle}>Характеристики</h2>
            <ul className={styles.list}>
              {product.features.map((feature) => (
                <li key={feature} className={styles.listItem}>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={styles.detailTitle}>Догляд</h2>
            <ul className={styles.list}>
              {product.care.map((item) => (
                <li key={item} className={styles.listItem}>
                  {item}
                </li>
              ))}
            </ul>

            <ShippingNote />
          </div>
        </div>
      </div>

      <Section
        eyebrow="Разом беруть"
        title="Доповніть гардероб"
        action={{ href: "/catalog", label: "Весь каталог" }}
        tight
      >
        <RelatedProducts slug={product.slug} />
      </Section>

      <ProductJsonLd product={product} lowestPrice={lowest} />
    </>
  );
}

function ShippingNote() {
  return (
    <div className={styles.shipping}>
      <p className={styles.shippingItem}>
        <strong>Доставка 1–3 дні</strong>
        <span>Нова Пошта по Україні. Безкоштовно від {formatMoney(150000)}.</span>
      </p>
      <p className={styles.shippingItem}>
        <strong>Обмін розміру — 14 днів</strong>
        <span>Перший обмін за наш кошт, якщо посадка не підійшла.</span>
      </p>
    </div>
  );
}

async function RelatedProducts({ slug }: { slug: string }) {
  const related = await getRelatedProducts(slug);
  return <ProductGrid products={related} />;
}

/** Product schema so Google can show price and availability in results. */
function ProductJsonLd({ product, lowestPrice }: { product: Product; lowestPrice: number }) {
  const inStock = product.variants.some((variant) => variant.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.title}${product.line ? ` ${product.line}` : ""}`,
    description: product.summary,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "UAH",
      lowPrice: (lowestPrice / 100).toFixed(0),
      offerCount: product.variants.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
