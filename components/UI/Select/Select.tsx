import { ChevronDown } from "lucide-react";
import { useId, useMemo } from "react";

import { ISelectProps, SelectRoundedType, SelectSizeType } from "./types";

/**
 * A styled native <select>. Deliberately not a custom listbox: the native
 * element gives keyboard navigation, type-ahead and the mobile OS picker for
 * free, none of which are worth reimplementing here.
 *
 * Multi-selection (sources, categories, authors) is done with Checkbox groups,
 * not `multiple` — a native multi-select is poor UX on both desktop and mobile.
 */
const Select = ({
  label,
  error,
  options,
  placeholder,
  selectElSize = "md",
  rounded = "default",
  wrapperClassName = "",
  labelClassName = "",
  errorClassName = "",
  className = "",
  id,
  defaultValue,
  value,
  ...rest
}: ISelectProps) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;

  const selectSize = useMemo(() => {
    const sizeMapping: Record<SelectSizeType, string> = {
      sm: "py-1 pl-3 pr-9 text-sm",
      md: "py-1.5 pl-3 pr-9 text-base",
      lg: "py-2 pl-3 pr-9 text-lg",
    };

    return sizeMapping[selectElSize] || sizeMapping.md;
  }, [selectElSize]);

  const selectRounded = useMemo(() => {
    const roundedMapping: Record<SelectRoundedType, string> = {
      default: "rounded-md",
      rounded: "rounded-lg",
    };

    return roundedMapping[rounded] || roundedMapping.default;
  }, [rounded]);

  const borderAndRing = error
    ? "border-danger focus:ring-3 focus:ring-danger/20"
    : "border-border-color focus:border-border-strong focus:ring-3 focus:ring-ring";

  // An uncontrolled select with a placeholder needs the empty value selected by
  // default, or the browser shows the first real option instead.
  const resolvedDefault =
    value === undefined && defaultValue === undefined && placeholder
      ? ""
      : defaultValue;

  return (
    <div className={`flex w-full flex-col gap-1 ${wrapperClassName}`}>
      {label ? (
        <label
          htmlFor={selectId}
          className={`text-sm font-medium text-text-color ${labelClassName}`}
        >
          {label}
        </label>
      ) : null}

      <div className="relative flex w-full items-center">
        <select
          id={selectId}
          value={value}
          defaultValue={resolvedDefault}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full cursor-pointer appearance-none border bg-surface text-text-color outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${selectSize} ${selectRounded} ${borderAndRing} ${className}`}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 size-4 text-muted-text"
        />
      </div>

      {error ? (
        <p id={errorId} className={`text-sm text-danger ${errorClassName}`}>
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default Select;
