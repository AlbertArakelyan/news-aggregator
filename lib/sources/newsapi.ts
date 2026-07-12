import { articleId, cleanAuthor, nullIfBlank, toIsoDate } from "./normalize";
import { Article, ArticleQuery, NewsSource } from "./types";

const ENDPOINT = "https://newsapi.org/v2/everything";

interface NewsApiArticle {
  source?: { id?: unknown; name?: unknown };
  author?: unknown;
  title?: unknown;
  description?: unknown;
  url?: unknown;
  urlToImage?: unknown;
  publishedAt?: unknown;
}

const newsapi: NewsSource = {
  id: "newsapi",
  name: "NewsAPI",

  capabilities: {
    keyword: true,
    dateRange: true,
    // `category` exists only on /top-headlines, not on /everything — and
    // /everything is the endpoint that supports keyword + date range together,
    // which the brief requires. So category is filtered in memory instead.
    category: false,
    author: false,
  },

  isConfigured: () => Boolean(process.env.NEWSAPI_KEY),

  buildUrl: (query: ArticleQuery) => {
    const url = new URL(ENDPOINT);

    url.searchParams.set("apiKey", process.env.NEWSAPI_KEY ?? "");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", String(query.pageSize ?? 20));
    url.searchParams.set("page", String(query.page ?? 1));

    // /everything rejects a request with no query at all, so fall back to a
    // broad term rather than 400ing on an empty feed.
    url.searchParams.set("q", query.keyword || "news");

    if (query.from) {
      url.searchParams.set("from", query.from);
    }

    if (query.to) {
      url.searchParams.set("to", query.to);
    }

    return url.toString();
  },

  parse: (raw: unknown): Article[] => {
    const articles = (raw as { articles?: NewsApiArticle[] })?.articles;

    if (!Array.isArray(articles)) {
      return [];
    }

    return articles.flatMap((article): Article[] => {
      const url = nullIfBlank(article.url);
      const title = nullIfBlank(article.title);
      const publishedAt = toIsoDate(article.publishedAt);

      if (!url || !title || !publishedAt) {
        return [];
      }

      // NewsAPI tombstones pulled articles as "[Removed]" rather than omitting
      // them. They have a url and a date, so nothing else filters them out.
      if (title === "[Removed]") {
        return [];
      }

      return [
        {
          id: articleId("newsapi", url),
          title,
          description: nullIfBlank(article.description),
          url,
          imageUrl: nullIfBlank(article.urlToImage),
          publishedAt,
          author: cleanAuthor(article.author),
          // /everything never returns a category.
          category: null,
          source: {
            id: "newsapi",
            // Keep the underlying outlet ("BBC News", "Reuters") — it is the
            // useful label, and NewsAPI is only the conduit.
            name: nullIfBlank(article.source?.name) ?? "NewsAPI",
          },
        },
      ];
    });
  },
};

export default newsapi;
