import Image from "next/image";
import Link from "next/link";

import { homeImages } from "../content";
import styles from "./home.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Image
        className={styles.heroImage}
        src={homeImages.hero}
        alt="Пудель Жуля на літній прогулянці"
        fill
        sizes="(max-width: 700px) 810px, 100vw"
        preload
      />
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>
            <Image src={homeImages.avatar} alt="" width={46} height={46} />
            <span>Тепер мені завжди буде комфортно!</span>
          </div>
          <h1 id="hero-title" className={styles.heroTitle}>
            Дива вже
            <br />
            чекають
          </h1>
          <p className={styles.heroText}>
            Стиль і зручність — щодня. Широкий вибір зимового та літнього одягу
            для вашого улюбленця.
          </p>
          <Link href="/catalog?collection=summer" className={styles.primaryLink}>
            Літня колекція <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
