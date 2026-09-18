import Image from "next/image";

import { lifestyleImages } from "../lifestyle-content";
import styles from "../lifestyle.module.css";
import { EditorialLink } from "./editorial-link";

export function BrandStory() {
  return (
    <section
      id="story"
      className={styles.storyBand}
      aria-labelledby="story-title"
    >
      <div className={`${styles.wrap} ${styles.story}`}>
        <div className={styles.storyPhoto}>
          <Image
            src={lifestyleImages.story}
            alt="Собаки Curly Joy зібралися за одним столом у домашній атмосфері"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
          <span className={styles.storyPhotoNote}>
            усі свої, усі за одним столом
          </span>
        </div>
        <div className={styles.storyCopy}>
          <p className={styles.handwritten}>Тут усе дуже особисте</p>
          <h2 id="story-title" className={styles.storyTitle}>
            Усе через
            <br />
            <em>любов.</em>
          </h2>
          <p>
            До мокрих носів. До ранків, які починаються з «гуляти!». До тих, хто
            зустрічає нас так, ніби ми повернулися з навколосвітньої подорожі.
          </p>
          <p>
            Ми живемо з собаками, пробуємо різні речі та ділимося своїми
            знахідками. Curly Joy — наш спосіб зробити ваше спільне життя трохи
            зручнішим. І набагато радіснішим.
          </p>
          <EditorialLink href="/catalog?collection=curly-joy-recommends">
            Те, що ми обираємо для своїх
          </EditorialLink>
          <span className={styles.storySignature}>З любов’ю, Curly Joy</span>
        </div>
      </div>
    </section>
  );
}
