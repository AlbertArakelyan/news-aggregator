import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import Button from "@/components/UI/Button/Button";
import Drawer from "@/components/UI/Drawer/Drawer";

import FilterPanel from "./FilterPanel";
import { IFilterBarProps } from "./types";

/**
 * The responsive shell around FilterPanel — and *only* the shell.
 *
 * Desktop gets a sidebar, mobile gets a Drawer, but both render the same
 * FilterPanel. The alternative (two copies of the controls, one per breakpoint)
 * is how filter markup drifts out of sync, and is exactly the duplication the
 * primitives exist to prevent.
 */
const FilterBar = ({
  filters,
  sourceOptions,
  isActive,
  onFiltersChange,
  onClear,
  className = "",
  ...rest
}: IFilterBarProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className={className} {...rest}>
      {/* Mobile: a trigger, and the panel inside a Drawer. */}
      <div className="lg:hidden">
        <Button
          variant="secondary"
          icon={<SlidersHorizontal className="size-4" />}
          onClick={() => setIsDrawerOpen(true)}
        >
          Filters
        </Button>

        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Filters"
          side="right"
        >
          <FilterPanel
            filters={filters}
            sourceOptions={sourceOptions}
            onFiltersChange={onFiltersChange}
          />

          <div className="mt-6 flex gap-3">
            {isActive ? (
              <Button variant="ghost" onClick={onClear}>
                Clear all
              </Button>
            ) : null}

            <Button className="flex-1" onClick={() => setIsDrawerOpen(false)}>
              Show results
            </Button>
          </div>
        </Drawer>
      </div>

      {/* Desktop: the same panel, always visible. */}
      <aside className="hidden lg:block">
        <div className="sticky top-8 flex flex-col gap-6 rounded-lg border border-border-color bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Filters</h2>

            {isActive ? (
              <Button variant="ghost" size="xs" onClick={onClear}>
                Clear all
              </Button>
            ) : null}
          </div>

          <FilterPanel
            filters={filters}
            sourceOptions={sourceOptions}
            onFiltersChange={onFiltersChange}
          />
        </div>
      </aside>
    </div>
  );
};

export default FilterBar;
