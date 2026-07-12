import {
  articleId,
  categoryFromLabel,
  cleanAuthor,
  nullIfBlank,
  stripHtml,
  toIsoDate,
} from "./normalize";
import { Article, ArticleQuery, CategoryId, NewsSource } from "./types";

const ENDPOINT = "https://content.guardianapis.com/search";

/** Our CategoryId -> the Guardian's own section id. */
const SECTIONS: Record<CategoryId, string> = {
  business: "business",
  culture: "culture",
  // The Guardian has no "health" section; health coverage sits under society.
  health: "society",
  politics: "politics",
  science: "science",
  sport: "sport",
  technology: "technology",
  world: "world",
};

interface GuardianResult {
  id?: unknown;
  webTitle?: unknown;
  webUrl?: unknown;
  webPublicationDate?: unknown;
  sectionId?: unknown;
  fields?: {
    trailText?: unknown;
    thumbnail?: unknown;
    byline?: unknown;
  };
}

const guardian: NewsSource = {
  id: "guardian",
  name: "The Guardian",

  capabilities: {
    keyword: true,
    dateRange: true,
    category: true,
    author: false,
  },

  isConfigured: () => Boolean(process.env.GUARDIAN_API_KEY),

  buildUrl: (query: ArticleQuery) => {
    const url = new URL(ENDPOINT);

    url.searchParams.set("api-key", process.env.GUARDIAN_API_KEY ?? "");
    // Without show-fields the response carries no description, image or byline.
    url.searchParams.set("show-fields", "trailText,thumbnail,byline");
    url.searchParams.set("order-by", "newest");
    url.searchParams.set("page-size", String(query.pageSize ?? 20));
    url.searchParams.set("page", String(query.page ?? 1));

    if (query.keyword) {
      url.searchParams.set("q", query.keyword);
    }

    if (query.from) {
      url.searchParams.set("from-date", query.from);
    }

    if (query.to) {
      url.searchParams.set("to-date", query.to);
    }

    if (query.category) {
      url.searchParams.set("section", SECTIONS[query.category]);
    }

    return url.toString();
  },

  parse: (raw: unknown): Article[] => {
    const results = (raw as { response?: { results?: GuardianResult[] } })
      ?.response?.results;

    if (!Array.isArray(results)) {
      return [];
    }

    return results.flatMap((result): Article[] => {
      const url = nullIfBlank(result.webUrl);
      const title = nullIfBlank(result.webTitle);
      const publishedAt = toIsoDate(result.webPublicationDate);

      // An article with no url, title or date is unusable downstream — drop it
      // rather than render a dead card or sort a NaN date to the top.
      if (!url || !title || !publishedAt) {
        return [];
      }

      return [
        {
          id: articleId("guardian", String(result.id ?? url)),
          title,
          description: stripHtml(result.fields?.trailText),
          url,
          imageUrl: nullIfBlank(result.fields?.thumbnail),
          publishedAt,
          author: cleanAuthor(result.fields?.byline),
          category: categoryFromLabel(result.sectionId, SECTIONS),
          source: { id: "guardian", name: "The Guardian" },
        },
      ];
    });
  },
};

export default guardian;
