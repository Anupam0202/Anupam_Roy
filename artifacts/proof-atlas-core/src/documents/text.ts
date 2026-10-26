/** Recorded in evidence packets. pa-tok-2 added plural folding and more stopwords. */
export const TOKENIZER_VERSION = "pa-tok-2";

/** English function words that carry little retrieval signal. */
export const STOPWORDS = new Set(
  "a about am an and are as at be been being but by can could did do does for from has have he her his how i if in into is it its of on or our she so than that the their them then there these they this to was we were what when where which who why will with would you your".split(
    " ",
  ),
);

/**
 * Folds simple English plurals so "credentials" matches "credential". Only a
 * final "s" is removed (never from -ss, -us or -is words), so the result is
 * always a prefix of the original word and highlighting still finds it.
 */
export function foldPlural(token: string): string {
  return token.length >= 4 && token.endsWith("s") && !/(ss|us|is)$/.test(token) ? token.slice(0, -1) : token;
}

/** Lowercases, splits on anything that is not a Unicode letter or number, drops stopwords and folds plurals. */
export function tokenize(text: string, { keepStopwords = false } = {}): string[] {
  const tokens = text.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? [];
  return (keepStopwords ? tokens : tokens.filter((t) => !STOPWORDS.has(t))).map(foldPlural);
}

/**
 * Control, invisible and bidirectional-override characters removed from
 * untrusted text (tab and newline are kept). Bidi overrides and isolates can
 * make displayed text read differently from what it contains.
 */
const STRIPPED_RANGES: Array<[number, number]> = [
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x9f],
  [0xad, 0xad],
  [0x200b, 0x200f],
  [0x2028, 0x2029],
  [0x202a, 0x202e],
  [0x2060, 0x2064],
  [0x2066, 0x2069],
  [0xfeff, 0xfeff],
];
const hex = (n: number) => `\\u${n.toString(16).padStart(4, "0")}`;
const STRIPPED = new RegExp(`[${STRIPPED_RANGES.map(([a, b]) => (a === b ? hex(a) : `${hex(a)}-${hex(b)}`)).join("")}]`, "g");

/**
 * Normalizes untrusted text: Unicode NFC, strips control and invisible
 * characters other than tab and newline, normalizes line endings and clamps
 * length without splitting a surrogate pair.
 */
export function sanitizeText(input: string, maxLength: number): string {
  const out = input.normalize("NFC").replace(/\r\n?/g, "\n").replace(STRIPPED, "").slice(0, maxLength);
  // Never end on half of a surrogate pair (an emoji cut by the length clamp).
  const last = out.charCodeAt(out.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? out.slice(0, -1) : out;
}
