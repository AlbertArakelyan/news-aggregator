import Button from "@/components/UI/Button/Button";
import Chip from "@/components/UI/Chip/Chip";
import { ArticleQuery } from "@/lib/sources/types";

import { IActiveFiltersProps } from "./types";

interface Pill {
  key: string;
  label: string;
  /** The patch that removes just this one filter. */
  remove: Partial<ArticleQuery>;
  /** Only the category is title-cased — a keyword must render as typed. */
  className?: string;
}

/**
 * Shows what is currently filtering the feed, and lets each one be removed.
 *
 * Without this, a filter set on mobile — behind the Drawer — is invisible once
 * the Drawer closes, and an empty feed looks like a broken app rather than a
 * narrow query.
 */
const ActiveFilters = ({
  filters,
  sourceOptions,
  isActive,
  onFiltersChange,
  onClear,
  className = "",
  ...rest
}: IActiveFiltersProps) => {
  if (!isActive) {
    return null;
  }

  const pills: Pill[] = [];

  if (filters.keyword) {
    pills.push({
      key: "keyword",
      label: `“${filters.keyword}”`,
      remove: { keyword: undefined },
    });
  }

  filters.categories?.forEach((category) => {
    pills.push({
      key: `category-${category}`,
      label: category,
      remove: {
        categories: (filters.categories ?? []).filter(
          (item) => item !== category,
        ),
      },
      className: "capitalize",
    });
  });

  if (filters.from) {
    pills.push({ key: "from", label: `From ${filters.from}`, remove: { from: undefined } });
  }

  if (filters.to) {
    pills.push({ key: "to", label: `To ${filters.to}`, remove: { to: undefined } });
  }

  filters.sources?.forEach((id) => {
    const source = sourceOptions.find((option) => option.id === id);

    pills.push({
      key: `source-${id}`,
      label: source?.name ?? id,
      remove: {
        sources: (filters.sources ?? []).filter((source) => source !== id),
      },
    });
  });

  filters.authors?.forEach((author) => {
    pills.push({
      key: `author-${author}`,
      label: author,
      remove: {
        authors: (filters.authors ?? []).filter((name) => name !== author),
      },
    });
  });

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} {...rest}>
      {pills.map((pill) => (
        <Chip
          key={pill.key}
          variant="active"
          chipSize="sm"
          className={pill.className}
          removeLabel={`Remove filter ${pill.label}`}
          onRemove={() => onFiltersChange(pill.remove)}
        >
          {pill.label}
        </Chip>
      ))}

      <Button variant="ghost" size="xs" onClick={onClear}>
        Clear all
      </Button>
    </div>
  );
};

export default ActiveFilters;
