import { Icon } from "@/components/ui/icon";
import { site } from "@/lib/site";
import { getWelcomeOffer } from "../offer.server";
import styles from "../welcome-offer.module.css";
import { WelcomeOfferDialog } from "./welcome-offer-dialog";

export function HomeWelcomeOffer() {
  const offer = getWelcomeOffer();
  return (
    <section className={styles.section} aria-labelledby="welcome-title">
      <div className={styles.art} aria-hidden="true">
        <Icon name="paw" />
        <span>
          little things,
          <br />
          big happiness ♡
        </span>
      </div>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Раді знайомству</span>
        <h2 id="welcome-title">Ще більше радості разом</h2>
        <p>
          {offer
            ? offer.description
            : "Нові знахідки, історії наших хвостиків і натхнення для щасливого життя із собакою. Зустрінемось в Instagram?"}
        </p>
        {offer ? (
          <WelcomeOfferDialog offer={offer} />
        ) : (
          <a
            className={styles.button}
            href={site.socials[0].href}
            target="_blank"
            rel="noreferrer noopener"
          >
            До нашої спільноти
            <Icon name="arrow" />
          </a>
        )}
      </div>
    </section>
  );
}
