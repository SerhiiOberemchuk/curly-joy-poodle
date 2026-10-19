/** Published reviews needed before the shop rating is shown. */
export const MIN_RATING_REVIEWS = 5;
/** Customers needed before the counter is shown. */
export const MIN_CUSTOMERS = 50;

const EXCERPT_LENGTH = 200;

/** Rounded down so the claim never exceeds the data: 1 234 → 1 200. */
export function roundDownCount(count: number): number {
  const step =
    count < 100 ? 10 : count < 1_000 ? 50 : count < 10_000 ? 100 : 1_000;
  return Math.floor(count / step) * step;
}

/** About 200 characters, cut at a word boundary; the card links to the full review. */
export function reviewExcerpt(text: string): string {
  const chars = Array.from(text.trim());
  if (chars.length <= EXCERPT_LENGTH) return chars.join("");
  const cut = chars.slice(0, EXCERPT_LENGTH).join("");
  const boundary = cut.search(/\s\S*$/u);
  const words = boundary > EXCERPT_LENGTH / 2 ? cut.slice(0, boundary) : cut;
  return `${words.replace(/[\s,.;:!?—–-]+$/u, "")}…`;
}
