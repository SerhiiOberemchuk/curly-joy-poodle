import type { Metadata, Viewport } from "next";
import { Caveat, Montserrat, Pangolin } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import styles from "@/components/layout/site-layout.module.css";
import { HomeSelectionProvider } from "@/features/home/components/home-interactions";
import { site } from "@/lib/site";

import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const handwriting = Pangolin({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-home-handwriting",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      className={`${montserrat.variable} ${caveat.variable} ${handwriting.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <NuqsAdapter>
          <a href="#main-content" className="skip-link">
            Перейти до вмісту
          </a>
          <div className={styles.shell}>
            <HomeSelectionProvider>
              <SiteHeader />
              <main id="main-content" className={styles.main}>
                {children}
              </main>
              <SiteFooter />
            </HomeSelectionProvider>
          </div>
        </NuqsAdapter>
      </body>
    </html>
  );
}
