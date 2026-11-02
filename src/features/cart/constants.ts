/** Shared between the server cart and the client widgets, so no `server-only` here. */

export const CART_COOKIE = "cjp_cart_v2";
export const LEGACY_CART_COOKIE = "cjp_cart";
export const MAX_CART_LINES = 30;
export const CART_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
/** Small things that are easy to add on the way to free delivery. */
export const CART_SUGGESTION_LIMIT = 10;
