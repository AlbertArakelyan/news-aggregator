import { Check } from "lucide-react";
import { useId, useMemo } from "react";

import { CheckboxSizeType, ICheckboxProps } from "./types";

/**
 * The real <input type="checkbox"> stays in the DOM — visually hidden, not
 * removed — so keyboard focus, form submission and screen readers all behave
 * natively. The visible box is a sibling driven entirely by `peer-*` variants.
 */
const Checkbox = ({
  label,
  description,
  checkboxSize = "md",
  wrapperClassName = "",
  labelClassName = "",
  boxClassName = "",
  className = "",
  id,
  disabled,
  ...rest
}: ICheckboxProps) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  const { box, icon, text } = useMemo(() => {
    const sizeMapping: Record<
      CheckboxSizeType,
      { box: string; icon: string; text: string }
    > = {
      sm: { box: "size-4", icon: "size-3", text: "text-sm" },
      md: { box: "size-5", icon: "size-3.5", text: "text-base" },
    };

    return sizeMapping[checkboxSize] || sizeMapping.md;
  }, [checkboxSize]);

  return (
    <div className={`flex items-start gap-2.5 ${wrapperClassName}`}>
      <span className="relative flex shrink-0 items-center">
        <input
          type="checkbox"
          id={checkboxId}
          disabled={disabled}
          className={`peer absolute inset-0 cursor-pointer appearance-none rounded opacity-0 disabled:cursor-not-allowed ${className}`}
          {...rest}
        />

        {/*
          The tick is a *descendant* of this span, not a sibling of the input, so
          `peer-checked:` cannot target it directly — peer variants compile to a
          sibling combinator. Drive it from here, where the peer relationship
          actually holds.
        */}
        <span
          aria-hidden="true"
          className={`flex items-center justify-center rounded border border-border-strong bg-surface text-primary-foreground transition peer-checked:border-primary peer-checked:bg-primary peer-checked:[&_svg]:opacity-100 peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-disabled:opacity-50 ${box} ${boxClassName}`}
        >
          <Check className={`opacity-0 transition-opacity ${icon}`} />
        </span>
      </span>

      {label || description ? (
        <label
          htmlFor={checkboxId}
          className={`flex cursor-pointer flex-col ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          } ${labelClassName}`}
        >
          {label ? (
            <span className={`text-text-color ${text}`}>{label}</span>
          ) : null}
          {description ? (
            <span className="text-sm text-muted-text">{description}</span>
          ) : null}
        </label>
      ) : null}
    </div>
  );
};

export default Checkbox;
