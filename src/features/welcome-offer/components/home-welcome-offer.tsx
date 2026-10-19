import { Icon } from "@/components/ui/icon";
import { NewTabNote } from "@/components/ui/new-tab-note";
import type { Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { welcomeOfferCopy } from "../copy";
import { getWelcomeOffer } from "../offer.server";
import styles from "../welcome-offer.module.css";
import { WelcomeOfferDialog } from "./welcome-offer-dialog";

export async function HomeWelcomeOffer({ locale }: { locale: Locale }) {
  const offer = await getWelcomeOffer(locale);
  const copy = welcomeOfferCopy[locale];
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
        <span className={styles.eyebrow}>{copy.section.eyebrow}</span>
        <h2 id="welcome-title">{copy.section.title}</h2>
        <p>{offer ? offer.teaser : copy.section.community}</p>
        {offer ? (
          <WelcomeOfferDialog offer={offer} copy={copy.dialog} />
        ) : (
          <a
            className={styles.button}
            href={site.socials[0].href}
            target="_blank"
            rel="noreferrer noopener"
          >
            {copy.section.communityLink}
            <NewTabNote />
            <Icon name="arrow" />
          </a>
        )}
      </div>
    </section>
  );
}
