/** Only the loaded photo from the most recent card navigation is needed. */
let thumbnail: { original: string; url: string } | null = null;

export function rememberProductThumbnail(link: HTMLAnchorElement) {
  const media = link.closest("article")?.querySelector<HTMLElement>("[data-product-thumbnail]");
  const photo = media?.querySelector("img");
  const original = media?.dataset.productThumbnail;
  if (!original || !photo?.complete || !photo.naturalWidth || !photo.currentSrc) {
    thumbnail = null;
    return;
  }
  thumbnail = { original, url: photo.currentSrc };
}

export function getProductThumbnail(original: string | null | undefined) {
  return thumbnail?.original === original ? thumbnail : null;
}
