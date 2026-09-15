import Image from "next/image";

import { lifestyleImages } from "../lifestyle-content";
import styles from "../lifestyle.module.css";
import { EditorialLink } from "./editorial-link";

export function LifestyleHero() {
  return (
    <>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            Для собак. Та людей, які їх обожнюють.
          </p>
          <h1 id="home-title" className={styles.heroTitle}>
            Плани на день:
            <br />
            бути <em>разом.</em>
          </h1>
          <p className={styles.heroDescription}>
            Піти за новими запахами. Знайти пригоду. Зайняти весь диван. У нас є
            дещо для всього, що ви любите робити разом.
          </p>
          <div className={styles.heroActions}>
            <EditorialLink href="#moments" filled>
              А що робимо сьогодні?
            </EditorialLink>
            <EditorialLink href="/catalog">До каталогу</EditorialLink>
          </div>
          <p className={styles.heroNote}>Маленькі речі для великої любові.</p>
        </div>
        <div className={styles.heroCollage}>
          <div className={styles.heroPhoto}>
            <Image
              src={lifestyleImages.hero}
              alt="Знайомтеся, Луна — кучерявий пудель Curly Joy у рожевій футболці"
              fill
              sizes="(max-width: 640px) 85vw, 40vw"
              preload
            />
          </div>
          <div className={styles.picnicPhoto}>
            <div>
              <Image
                src={lifestyleImages.picnic}
                alt="А на вихідних — усією хвостатою компанією на пікнік"
                fill
                sizes="(max-width: 640px) 150px, 240px"
              />
            </div>
            <span>вихідні? тільки разом!</span>
          </div>
          <span className={styles.photoNote}>Луна готова. А ви?</span>
          <svg
            className={styles.curl}
            viewBox="0 0 160 100"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 16c27-13 61 6 48 29-14 25-43 8-32-11 13-23 56-17 67 8 10 23 26 32 62 20m-15-9 18 8-11 17"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>
      <div className={styles.promiseStrip} aria-label="Наші маленькі радощі">
        <span>гуляти</span>
        <span>грати</span>
        <span>обіймати</span>
        <span>досліджувати</span>
        <span>бути разом</span>
      </div>
    </>
  );
}
