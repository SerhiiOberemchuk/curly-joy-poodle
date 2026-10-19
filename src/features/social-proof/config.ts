/**
 * Owner-curated social proof for the home page. Nothing here is fetched or
 * invented: the owner edits these values, and an empty value hides its part.
 */
export interface InstagramScreenshot {
  /** A file in `public/social-proof/`, shown in a 9:16 frame cropped from the top. */
  src: `/social-proof/${string}`;
  /** What the screenshot shows, for screen readers and failed loads. */
  alt: string;
}

/** 4–6 screenshots the buyers allowed to publish, with their names blurred. */
export const instagramScreenshots: readonly InstagramScreenshot[] = [];

/** Follower count on the Instagram button; null shows the button without it. */
export const instagramFollowers: number | null = null;
