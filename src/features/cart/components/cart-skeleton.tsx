"use client";

import { useSyncExternalStore } from "react";

import { Bone } from "@/components/ui/skeleton";
import { ProductShelfSkeleton } from "@/features/catalog/components/product-shelf";

import { browserCartLineCount, subscribeBrowserCart } from "../cart-cookie.client";
import { CART_SUGGESTION_LIMIT } from "../constants";
import styles from "./cart-view.module.css";
import skeleton from "./cart-skeleton.module.css";

function LineSkeleton() {
  return (
    <div className={styles.line}>
      <Bone className={skeleton.photo} />
      <div className={styles.lineBody}>
        <div className={styles.lineTop}>
          <div className={skeleton.lineCopy}>
            <div className={`${styles.lineTitle} ${skeleton.title}`}>
              <Bone line />
              <Bone line className={skeleton.titleWrap} />
            </div>
            <Bone line className={`${styles.lineMeta} ${skeleton.meta}`} />
          </div>
          <Bone line className={skeleton.price} />
        </div>
        <Bone line className={`${styles.lineMeta} ${skeleton.meta}`} />
        <div className={styles.lineControls}>
          <Bone className={skeleton.stepper} />
          <Bone line className={`${styles.remove} ${skeleton.remove}`} />
        </div>
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className={styles.summary}>
      <div className={styles.summaryTitle}>
        <Bone line className={skeleton.summaryTitle} />
      </div>
      <Bone line className={styles.summaryRow} />
      <Bone line className={styles.summaryRow} />
      <div className={styles.summaryTotal}>
        <Bone line className={skeleton.total} />
      </div>
      <Bone className={skeleton.checkout} />
      <Bone className={skeleton.back} />
    </div>
  );
}

/**
 * The cart's lines, summary and suggestions while it is checked against the
 * CRM. The browser's cart cookie tells how many lines there are; before the
 * page runs (or with an unreadable old cookie) one line stands in. Titles,
 * prices and the free-delivery progress are not in the cookie: the lines
 * take the common shape and the summary goes without the progress box.
 */
export function CartSkeleton() {
  const lines = useSyncExternalStore(
    subscribeBrowserCart,
    () => browserCartLineCount() ?? 1,
    () => 1,
  );
  return (
    <>
      <p className="visually-hidden" role="status">
        Завантажуємо кошик
      </p>
      {lines === 0 ? (
        <div className={styles.empty} aria-hidden="true">
          <Bone className={skeleton.glyph} />
          <h2>
            <Bone className={skeleton.emptyTitle}>Кошик порожній</Bone>
          </h2>
          <Bone line className={`${styles.emptyText} ${skeleton.emptyText}`} />
          <Bone line className={`${styles.emptyText} ${skeleton.emptyText}`} />
          <Bone className={skeleton.emptyButton} />
        </div>
      ) : (
        <div aria-hidden="true">
          <div className={styles.layout}>
            <div className={styles.lines}>
              {Array.from({ length: lines }, (_, index) => (
                <LineSkeleton key={index} />
              ))}
            </div>
            <SummarySkeleton />
          </div>
          <div className={styles.suggestions}>
            <h2>Додайте до замовлення</h2>
            <p>Приємні дрібниці, які легко додати до кошика.</p>
            <ProductShelfSkeleton count={CART_SUGGESTION_LIMIT} />
          </div>
        </div>
      )}
    </>
  );
}
