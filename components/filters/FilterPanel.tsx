import Checkbox from "@/components/UI/Checkbox/Checkbox";
import Input from "@/components/UI/Input/Input";
import Select from "@/components/UI/Select/Select";
import { CATEGORY_IDS, CategoryId, SourceId } from "@/lib/sources/types";

import SearchInput from "./SearchInput";
import { IFilterPanelProps } from "./types";

const CATEGORY_OPTIONS = CATEGORY_IDS.map((id) => ({
  value: id,
  // "sport" -> "Sport". The ids are already the label, just lowercased.
  label: id.charAt(0).toUpperCase() + id.slice(1),
}));

/**
 * The controls themselves — rendered once, used twice: inline on desktop and
 * inside the Drawer on mobile. Duplicating this markup for the two layouts is
 * exactly the repetition the primitives exist to prevent.
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
  const selectedSources = filters.sources ?? [];

  const toggleSource = (id: SourceId, isChecked: boolean) => {
    onFiltersChange({
      sources: isChecked
        ? [...selectedSources, id]
        : selectedSources.filter((source) => source !== id),
    });
  };

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

      <Select
        label="Category"
        placeholder="Any category"
        options={CATEGORY_OPTIONS}
        value={filters.category ?? ""}
        onChange={(event) =>
          onFiltersChange({
            category: (event.target.value || undefined) as CategoryId | undefined,
          })
        }
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

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-sm font-medium text-text-color">Sources</legend>

        {/*
          Checkboxes rather than a multi-select: a native <select multiple> is
          poor UX on desktop and worse on mobile, and a custom listbox would mean
          rebuilding keyboard nav and the mobile picker for no gain.

          No source checked means "all sources" — the same result as checking
          every box, without making the reader do it.
        */}
        {sourceOptions.map((source) => (
          <Checkbox
            key={source.id}
            checkboxSize="sm"
            label={source.name}
            checked={selectedSources.includes(source.id)}
            onChange={(event) => toggleSource(source.id, event.target.checked)}
          />
        ))}
      </fieldset>
    </form>
  );
};

export default FilterPanel;
