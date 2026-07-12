import Card from "@/components/UI/Card/Card";
import Chip from "@/components/UI/Chip/Chip";

import { IArticleCardProps } from "./types";

/**
 * Dates are formatted with an explicit UTC timezone. Letting the runtime pick
 * the locale would render one string on the server and another in the browser,
 * which React reports as a hydration mismatch.
 */
const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const ArticleCard = ({ article, className = "", ...rest }: IArticleCardProps) => {
  return (
    <Card
      isInteractive
      padding="none"
      // `relative` is load-bearing: the headline's stretched link below is
      // absolutely positioned and would otherwise cover the whole page.
      className={`relative overflow-hidden ${className}`}
      {...rest}
    >
      <article className="flex h-full flex-col">
        {article.imageUrl ? (
          // Plain <img>: the providers serve images from many hosts, and
          // next/image would need every one whitelisted in next.config.ts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            className="h-40 w-full bg-surface-sunken object-cover"
          />
        ) : null}

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip chipSize="sm">{article.source.name}</Chip>
            {article.category ? (
              <Chip chipSize="sm" variant="info" className="capitalize">
                {article.category}
              </Chip>
            ) : null}
          </div>

          <h2 className="text-lg font-medium leading-snug">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              // Stretches the link over the whole card, so the entire surface is
              // clickable while the accessible name stays just the headline.
              className="outline-none after:absolute after:inset-0 focus-visible:underline"
            >
              {article.title}
            </a>
          </h2>

          {article.description ? (
            <p className="line-clamp-3 text-sm text-muted-text">
              {article.description}
            </p>
          ) : null}

          <p className="mt-auto flex flex-wrap gap-x-2 text-xs text-subtle-text">
            {article.author ? <span>{article.author}</span> : null}
            {article.author ? <span aria-hidden="true">·</span> : null}
            <time dateTime={article.publishedAt}>
              {formatter.format(new Date(article.publishedAt))}
            </time>
          </p>
        </div>
      </article>
    </Card>
  );
};

export default ArticleCard;
