import Checkbox from "@/components/UI/Checkbox/Checkbox";

import { ICheckboxGroupProps } from "./types";

/**
 * A labelled set of checkboxes over a list of values.
 *
 * Exists because four places wanted exactly this — preferred sources, preferred
 * categories, filter sources, filter categories — and each had grown its own
 * copy of the same fieldset and the same add/remove toggle. The toggle now lives
 * here, once.
 *
 * Generic over the value type so `SourceId[]` and `CategoryId[]` stay typed at
 * the call site rather than degrading to `string[]`.
 */
const CheckboxGroup = <T extends string>({
  legend,
  options,
  selected,
  onChange,
  checkboxSize = "sm",
  legendClassName = "",
  optionLabelClassName = "",
  className = "",
  ...rest
}: ICheckboxGroupProps<T>) => {
  const toggle = (value: T, isChecked: boolean) => {
    onChange(
      isChecked
        ? [...selected, value]
        : selected.filter((item) => item !== value),
    );
  };

  return (
    <fieldset className={`flex flex-col gap-2.5 ${className}`} {...rest}>
      {legend ? (
        <legend className={`mb-2 text-sm font-medium text-text-color ${legendClassName}`}>
          {legend}
        </legend>
      ) : null}

      {options.map((option) => (
        <Checkbox
          key={option.value}
          checkboxSize={checkboxSize}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
          labelClassName={optionLabelClassName}
          checked={selected.includes(option.value)}
          onChange={(event) => toggle(option.value, event.target.checked)}
        />
      ))}
    </fieldset>
  );
};

export default CheckboxGroup;
