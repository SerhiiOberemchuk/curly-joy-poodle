import Image from "next/image";

import { site } from "@/lib/site";
import { gallery } from "../content";
import styles from "./home.module.css";

export function Community() {
  const instagram = site.socials.find(
    (social) => social.label === "Instagram",
  )!;

  return (
    <section
      className={`container ${styles.section}`}
      aria-labelledby="community-title"
    >
      <div className={styles.centerHeading}>
        <p className={styles.eyebrow}>Місце щасливих собак</p>
        <h2 id="community-title">Життя разом із Curly Joy</h2>
        <p>
          Підписуйтесь на{" "}
          <a href={instagram.href} target="_blank" rel="noreferrer noopener">
            @curly_joy_poodle
          </a>{" "}
          та показуйте свого улюбленця.
        </p>
      </div>
      <div className={styles.gallery}>
        {gallery.map((photo) => (
          <a
            key={photo.image}
            href={instagram.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${photo.alt} — відкрити Instagram`}
          >
            <Image
              src={photo.image}
              alt={photo.alt}
              fill
              sizes="(max-width: 700px) 50vw, 290px"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
