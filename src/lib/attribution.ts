/**
 * Marketing attribution for the CRM: which ad or campaign brought the buyer.
 *
 * Mirrors the CRM's own widget loader (`/widget.js`) so both entry points mean
 * the same thing: the FIRST tagged visit is remembered for 30 days, the latest
 * tagged visit is the LAST touch. Contract: the CRM's `orderAttributionSchema`
 * and `leadAttributionSchema` (every field an optional string, no nulls).
 * Pure — no storage, no DOM — so the rules are unit-tested.
 */

/** The only query parameters ever read; a URL can carry session tokens. */
const UTM_PARAMS = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_content", "utmContent"],
  ["utm_term", "utmTerm"],
] as const;
/** Order matters: the first one present names the ad platform. */
const CLICK_ID_PARAMS = ["fbclid", "gclid", "oppref"] as const;

export const ATTRIBUTION_TTL_MS = 30 * 86_400_000;
const UTM_MAX = 255;
const CLICK_ID_MAX = 512;

export interface Touch {
  clickId?: string;
  clickIdParam?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmMedium?: string;
  utmSource?: string;
  utmTerm?: string;
}
export interface TimedTouch {
  /** When the visit happened, epoch ms. */
  at: number;
  touch: Touch;
}
export interface StoredAttribution {
  first: TimedTouch;
  /** Latest tagged visit after the first one; absent until there is one. */
  last?: TimedTouch;
}
/** The block as the CRM accepts it on an order or a lead. */
export type CrmAttribution = Touch & {
  lastTouch?: Touch & { at?: string };
};

function clean(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
}

export function isEmptyTouch(touch: Touch | null | undefined): boolean {
  return !touch || Object.values(touch).every((value) => !value);
}

/** The tagged parameters of a landing URL, or null when it carries none. */
export function parseTouch(search: string): Touch | null {
  const params = new URLSearchParams(search);
  const touch: Touch = {};
  for (const [param, field] of UTM_PARAMS) {
    const value = clean(params.get(param), UTM_MAX);
    if (value) touch[field] = value;
  }
  for (const param of CLICK_ID_PARAMS) {
    const value = clean(params.get(param), CLICK_ID_MAX);
    if (value) {
      touch.clickId = value;
      touch.clickIdParam = param;
      break;
    }
  }
  return isEmptyTouch(touch) ? null : touch;
}

function sameTouch(a: Touch, b: Touch): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof Touch
  >;
  return [...keys].every((key) => (a[key] ?? "") === (b[key] ?? ""));
}

/**
 * First touch wins while it is under 30 days old; every tagged visit after it
 * is the last touch. No tagged visit and nothing valid stored → null.
 */
export function mergeAttribution(
  stored: StoredAttribution | null,
  current: Touch | null,
  now: number,
): StoredAttribution | null {
  const live =
    stored && stored.first.at <= now && now - stored.first.at <= ATTRIBUTION_TTL_MS
      ? stored
      : null;
  if (!live) return current ? { first: { at: now, touch: current } } : null;
  if (!current) return live;
  return { first: live.first, last: { at: now, touch: current } };
}

/** Keeps only the known fields, trimmed and capped; null when none remain. */
export function sanitizeTouch(value: unknown): Touch | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const touch: Touch = {};
  for (const [, field] of UTM_PARAMS) {
    const text = clean(source[field], UTM_MAX);
    if (text) touch[field] = text;
  }
  const clickId = clean(source.clickId, CLICK_ID_MAX);
  const clickIdParam = clean(source.clickIdParam, 40);
  if (clickId && clickIdParam) {
    touch.clickId = clickId;
    touch.clickIdParam = clickIdParam;
  }
  return isEmptyTouch(touch) ? null : touch;
}

function readTimed(value: unknown): TimedTouch | null {
  if (!value || typeof value !== "object") return null;
  const { at, touch } = value as Record<string, unknown>;
  if (typeof at !== "number" || !Number.isFinite(at)) return null;
  const sanitized = sanitizeTouch(touch);
  return sanitized ? { at, touch: sanitized } : null;
}

/** Reads what storage held; anything malformed is treated as nothing stored. */
export function parseStored(raw: string | null): StoredAttribution | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown> | null;
    const first = readTimed(value?.first);
    if (!first) return null;
    const last = readTimed(value?.last);
    return last ? { first, last } : { first };
  } catch {
    return null;
  }
}

/**
 * The block to send. The last touch is omitted when it equals the first (a
 * single visit is both). Nothing to say → undefined, so the key is left out of
 * the request entirely.
 */
export function toCrmAttribution(
  stored: StoredAttribution | null,
  now: number,
): CrmAttribution | undefined {
  if (!stored || now - stored.first.at > ATTRIBUTION_TTL_MS) return undefined;
  const block: CrmAttribution = { ...stored.first.touch };
  const last = stored.last;
  if (
    last &&
    now - last.at <= ATTRIBUTION_TTL_MS &&
    !sameTouch(last.touch, stored.first.touch)
  ) {
    block.lastTouch = { ...last.touch, at: new Date(last.at).toISOString() };
  }
  return isEmptyTouch(block) ? undefined : block;
}

/**
 * Re-validates a block that came back from the browser: the server never
 * trusts it, and re-shapes it into exactly the CRM's fields.
 */
export function parseSubmittedAttribution(
  raw: string,
): CrmAttribution | undefined {
  if (!raw || raw.length > 4_000) return undefined;
  try {
    const value = JSON.parse(raw) as Record<string, unknown> | null;
    const first = sanitizeTouch(value);
    if (!first) return undefined;
    const block: CrmAttribution = { ...first };
    const lastValue = value?.lastTouch;
    const last = sanitizeTouch(lastValue);
    if (last) {
      const at = clean((lastValue as Record<string, unknown>).at, 40);
      block.lastTouch =
        at && !Number.isNaN(Date.parse(at)) ? { ...last, at } : last;
    }
    return block;
  } catch {
    return undefined;
  }
}
