import Image from "next/image";
import Link from "next/link";

import { homeImages } from "../content";
import styles from "./home.module.css";

export function BrandValues() {
  return (
    <section className={styles.storySection} aria-labelledby="values-title">
      <div className={`container ${styles.storyGrid}`}>
        <div className={styles.storyImage}>
          <Image
            src={homeImages.values}
            alt="Пуделі Curly Joy зібралися разом за столом"
            fill
            sizes="(max-width: 700px) 100vw, 550px"
          />
        </div>
        <div className={styles.storyContent}>
          <p className={styles.eyebrow}>Наші цінності</p>
          <h2 id="values-title">
            Турбота —<br />у кожній деталі
          </h2>
          <ul className={styles.valuesList}>
            <li>Офіційний дистриб’ютор GF Pet в Україні</li>
            <li>Перевірені матеріали, безпечні для шкіри собаки</li>
            <li>Підбір розміру з можливістю обміну</li>
          </ul>
          <p>
            Наша увага до деталей, якість та зручність обслуговування — це те,
            що об’єднує Curly Joy. І це лише початок!
          </p>
          <Link href="/catalog" className={styles.primaryLink}>
            Більше товарів <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
