import { TriangleAlert } from "lucide-react";

import Chip from "@/components/UI/Chip/Chip";

import { ISourceStatusProps } from "./types";

/**
 * Names the sources that failed while the rest of the feed still renders.
 *
 * The aggregator degrades per-source rather than failing whole; without
 * surfacing that, a provider being down looks identical to there being no news.
 */
const SourceStatus = ({ sources, className = "", ...rest }: ISourceStatusProps) => {
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
