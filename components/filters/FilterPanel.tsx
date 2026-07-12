import CheckboxGroup from "@/components/UI/CheckboxGroup/CheckboxGroup";
import Input from "@/components/UI/Input/Input";
import { CATEGORY_IDS, CategoryId, SourceId } from "@/lib/sources/types";

import SearchInput from "./SearchInput";
import { IFilterPanelProps } from "./types";

const CATEGORY_OPTIONS = CATEGORY_IDS.map((id) => ({ value: id, label: id }));

/**
 * The controls themselves — rendered once, used twice: inline on desktop and
 * inside the Drawer on mobile. Duplicating this markup per breakpoint is exactly
 * the repetition the primitives exist to prevent.
 *
 * Presentational: it holds no filter state, and reports every change upward.
 */
const FilterPanel = ({
  filters,
  sourceOptions,
  onFiltersChange,
  className = "",
  ...rest
}: IFilterPanelProps) => {
  return (
    <form
      // A filter change applies immediately; submitting would only reload.
      onSubmit={(event) => event.preventDefault()}
      className={`flex flex-col gap-5 ${className}`}
      {...rest}
    >
      <SearchInput
        value={filters.keyword ?? ""}
        onSearch={(keyword) => onFiltersChange({ keyword: keyword || undefined })}
      />

      {/* Nothing checked means "all categories" — the same result as checking
          every box, without making the reader do it. */}
      <CheckboxGroup<CategoryId>
        legend="Categories"
        options={CATEGORY_OPTIONS}
        selected={filters.categories ?? []}
        onChange={(categories) => onFiltersChange({ categories })}
        optionLabelClassName="capitalize"
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium text-text-color">Date</legend>

        <Input
          type="date"
          label="From"
          inputElSize="sm"
          value={filters.from ?? ""}
          // A date input clears to "", which must become "no filter", not "".
          onChange={(event) =>
            onFiltersChange({ from: event.target.value || undefined })
          }
        />
        <Input
          type="date"
          label="To"
          inputElSize="sm"
          value={filters.to ?? ""}
          onChange={(event) =>
            onFiltersChange({ to: event.target.value || undefined })
          }
        />
      </fieldset>

      <CheckboxGroup<SourceId>
        legend="Sources"
        options={sourceOptions.map((source) => ({
          value: source.id,
          label: source.name,
        }))}
        selected={filters.sources ?? []}
        onChange={(sources) => onFiltersChange({ sources })}
      />
    </form>
  );
};

export default FilterPanel;
