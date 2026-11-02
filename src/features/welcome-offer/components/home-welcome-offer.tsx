import { Icon } from "@/components/ui/icon";
import { NewTabNote } from "@/components/ui/new-tab-note";
import type { Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { welcomeOfferCopy } from "../copy";
import { getWelcomeOffer } from "../offer.server";
import styles from "../welcome-offer.module.css";
import { WelcomeOfferDialog, WelcomeOfferForm } from "./welcome-offer-dialog";

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
        {offer ? (
          <>
            {/* The offer itself is the headline: what the buyer gets. */}
            <h2 id="welcome-title">{offer.title}</h2>
            <p>{offer.teaser}</p>
            <WelcomeOfferForm offer={offer} copy={copy.dialog} />
            <WelcomeOfferDialog offer={offer} copy={copy.dialog} trigger={false} />
          </>
        ) : (
          <>
            <h2 id="welcome-title">{copy.section.title}</h2>
            <p>{copy.section.community}</p>
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
          </>
        )}
      </div>
    </section>
  );
}
