import { CategoryId, SourceId } from "./types";

/** Providers return "", null, or whitespace for a missing field. Collapse them. */
export function nullIfBlank(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

/**
 * Guardian's trailText contains HTML (`<p>`, `<strong>`). Descriptions render as
 * plain text, so strip tags rather than dangerouslySetInnerHTML-ing a provider's
 * markup into the page.
 */
export function stripHtml(value: unknown): string | null {
  const text = nullIfBlank(value);

  if (text === null) {
    return null;
  }

  return nullIfBlank(text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

/**
 * Providers disagree on date format — Guardian sends ISO with Z, NYT sends
 * "2026-07-01T09:30:00+0000". Normalizing here is the adapter's job, so nothing
 * downstream ever has to guess.
 *
 * Returns null for an unparseable date; the caller drops the article rather than
 * sorting a NaN to the top of the feed.
 */
export function toIsoDate(value: unknown): string | null {
  const text = nullIfBlank(value);

  if (text === null) {
    return null;
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** "By Jane Doe" / "jane doe, john smith" -> "Jane Doe". */
export function cleanAuthor(value: unknown): string | null {
  const text = nullIfBlank(value);

  if (text === null) {
    return null;
  }

  return nullIfBlank(text.replace(/^by\s+/i, ""));
}

export function articleId(source: SourceId, providerId: string): string {
  return `${source}:${providerId}`;
}

/** Reverse a category map: provider's own label -> our CategoryId. */
export function categoryFromLabel(
  label: unknown,
  map: Record<CategoryId, string>,
): CategoryId | null {
  const text = nullIfBlank(label);

  if (text === null) {
    return null;
  }

  const needle = text.toLowerCase();
  const match = (Object.entries(map) as [CategoryId, string][]).find(
    ([, providerLabel]) => providerLabel.toLowerCase() === needle,
  );

  return match ? match[0] : null;
}
