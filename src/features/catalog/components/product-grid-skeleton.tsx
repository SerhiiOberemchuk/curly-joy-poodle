import styles from "./product-grid-skeleton.module.css";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.card} />
      ))}
    </div>
  );
}
