import Image from "next/image";
import Link from "next/link";

import { homeImages } from "../content";
import styles from "./home.module.css";

export function SizeTeaser() {
  return (
    <section className={styles.storySection} aria-labelledby="fit-title">
      <div className={`container ${styles.storyGrid}`}>
        <div className={styles.storyImage}>
          <Image
            src={homeImages.fit}
            alt="Допитливі пуделі — команда GF PET"
            fill
            sizes="(max-width: 700px) 100vw, 550px"
          />
        </div>
        <div className={styles.storyContent}>
          <p className={styles.eyebrow}>Найкраща посадка на ринку</p>
          <h2 id="fit-title">
            Собака хоче
            <br />
            носити комфорт
          </h2>
          <p>
            Завдяки технології Elasto-fit® одяг GF PET підлаштовується під
            індивідуальну форму тіла собаки в зоні шиї та грудей.
          </p>
          <p>
            Еластичні вставки забезпечують комфортне прилягання, не тиснуть і не
            заважають рухам. Щоб вільно бігати, стрибати й гратися під час
            кожної прогулянки.
          </p>
          <Link href="/info/sizes" className={styles.primaryLink}>
            Як обрати розмір <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
