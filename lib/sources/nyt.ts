import {
  articleId,
  categoryFromLabel,
  cleanAuthor,
  nullIfBlank,
  toIsoDate,
} from "./normalize";
import { Article, ArticleQuery, CategoryId, NewsSource } from "./types";

const ENDPOINT = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
const IMAGE_BASE = "https://static01.nyt.com/";

/** Our CategoryId -> NYT's own section_name value. */
const SECTIONS: Record<CategoryId, string> = {
  business: "Business Day",
  culture: "Arts",
  health: "Health",
  politics: "Politics",
  science: "Science",
  sport: "Sports",
  technology: "Technology",
  world: "World",
};

/** NYT wants YYYYMMDD, not YYYY-MM-DD. */
function toNytDate(date: string): string {
  return date.replace(/-/g, "");
}

interface NytMultimedia {
  url?: unknown;
  default?: { url?: unknown };
}

interface NytDoc {
  _id?: unknown;
  web_url?: unknown;
  abstract?: unknown;
  snippet?: unknown;
  pub_date?: unknown;
  section_name?: unknown;
  headline?: { main?: unknown };
  byline?: { original?: unknown };
  multimedia?: NytMultimedia[] | NytMultimedia;
}

/**
 * NYT has changed this field's shape: it used to be an array of crops with
 * root-relative `url`s, and newer responses nest a `default.url` that is already
 * absolute. Handle both — a fixture recorded today should not silently stop
 * working when they migrate.
 */
function toImageUrl(multimedia: NytDoc["multimedia"]): string | null {
  const candidate = Array.isArray(multimedia) ? multimedia[0] : multimedia;

  if (!candidate) {
    return null;
  }

  const nested = nullIfBlank(candidate.default?.url);
  const flat = nullIfBlank(candidate.url);
  const url = nested ?? flat;

  if (url === null) {
    return null;
  }

  return url.startsWith("http") ? url : `${IMAGE_BASE}${url.replace(/^\/+/, "")}`;
}

const nyt: NewsSource = {
  id: "nyt",
  name: "New York Times",

  capabilities: {
    keyword: true,
    dateRange: true,
    category: true,
    author: false,
  },

  // The Article Search API authenticates with the api-key alone. NYT also issues
  // a secret, but it is only for their OAuth-style apps — this endpoint does not
  // take it, so NYT_SECRET_API_KEY is deliberately unused.
  isConfigured: () => Boolean(process.env.NYT_API_KEY),

  buildUrl: (query: ArticleQuery) => {
    const url = new URL(ENDPOINT);

    url.searchParams.set("api-key", process.env.NYT_API_KEY ?? "");
    url.searchParams.set("sort", "newest");
    // NYT pages in fixed blocks of 10 and offers no page-size parameter.
    url.searchParams.set("page", String((query.page ?? 1) - 1));

    if (query.keyword) {
      url.searchParams.set("q", query.keyword);
    }

    if (query.from) {
      url.searchParams.set("begin_date", toNytDate(query.from));
    }

    if (query.to) {
      url.searchParams.set("end_date", toNytDate(query.to));
    }

    if (query.categories?.length) {
      // Filter Query syntax — Lucene-ish, and the quotes are required. Several
      // quoted values inside one set of parens are OR'd:
      //   section.name:("Science" "Technology")
      //
      // The field is `section.name` with a DOT, even though the same field comes
      // back in the response as `section_name` with an underscore. Using the
      // response spelling in a query is not an error: NYT answers 200 with
      // `docs: null, hits: 0`, so every categorized feed silently loses NYT and
      // nothing anywhere reports a problem. Verified against the live API —
      // section.name:("World") returns 10,000 hits, section_name:("World")
      // returns zero.
      const sections = query.categories
        .map((category) => `"${SECTIONS[category]}"`)
        .join(" ");

      url.searchParams.set("fq", `section.name:(${sections})`);
    }

    return url.toString();
  },

  parse: (raw: unknown): Article[] => {
    const docs = (raw as { response?: { docs?: NytDoc[] } })?.response?.docs;

    if (!Array.isArray(docs)) {
      return [];
    }

    return docs.flatMap((doc): Article[] => {
      const url = nullIfBlank(doc.web_url);
      const title = nullIfBlank(doc.headline?.main);
      const publishedAt = toIsoDate(doc.pub_date);

      if (!url || !title || !publishedAt) {
        return [];
      }

      return [
        {
          id: articleId("nyt", String(doc._id ?? url)),
          title,
          description: nullIfBlank(doc.abstract) ?? nullIfBlank(doc.snippet),
          url,
          imageUrl: toImageUrl(doc.multimedia),
          publishedAt,
          author: cleanAuthor(doc.byline?.original),
          category: categoryFromLabel(doc.section_name, SECTIONS),
          source: { id: "nyt", name: "New York Times" },
        },
      ];
    });
  },
};

export default nyt;
