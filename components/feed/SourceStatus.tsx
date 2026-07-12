import { KeyRound, TriangleAlert } from "lucide-react";

import Chip from "@/components/UI/Chip/Chip";

import { ISourceStatusProps } from "./types";

/**
 * Says what the feed could not do, and why.
 *
 * Two different silences look identical without this:
 *
 *   - **No sources configured at all.** Every adapter reports itself
 *     unconfigured, so nothing is even queried, and the feed renders "No
 *     articles found" — which is a lie. The cause is a missing API key, and the
 *     reader (or the developer running the container) has no way to know that.
 *     This bit for real: `docker compose up` passed no keys into the container.
 *   - **A source failed.** The aggregator degrades per-source, so the feed still
 *     renders; without naming the casualty, a provider being down looks exactly
 *     like there being no news.
 */
const SourceStatus = ({ sources, className = "", ...rest }: ISourceStatusProps) => {
  if (sources.length === 0) {
    return (
      <div
        role="status"
        className={`flex flex-wrap items-center gap-2 rounded-lg border border-border-color bg-warning-bg p-3 ${className}`}
        {...rest}
      >
        <KeyRound className="size-4 text-warning" aria-hidden="true" />
        <span className="text-sm text-text-color">
          No news sources are configured — set{" "}
          <code className="font-mono text-xs">GUARDIAN_API_KEY</code>,{" "}
          <code className="font-mono text-xs">NYT_API_KEY</code> or{" "}
          <code className="font-mono text-xs">NEWSAPI_KEY</code> in{" "}
          <code className="font-mono text-xs">.env</code>, or run with{" "}
          <code className="font-mono text-xs">NEWS_FIXTURES=1</code>.
        </span>
      </div>
    );
  }

  const failed = sources.filter((source) => !source.ok);

  if (failed.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-2 ${className}`}
      {...rest}
    >
      <TriangleAlert className="size-4 text-danger" aria-hidden="true" />
      <span className="text-sm text-muted-text">
        Some sources could not be reached:
      </span>
      {failed.map((source) => (
        <Chip key={source.id} variant="danger" chipSize="sm">
          {source.name}
        </Chip>
      ))}
    </div>
  );
};

export default SourceStatus;
