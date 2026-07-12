import { useId, useMemo } from "react";

import { IInputProps, InputRoundedType, InputSizeType } from "./types";

const Input = ({
  label,
  error,
  icon,
  iconPosition = "left",
  inputElSize = "md",
  rounded = "default",
  wrapperClassName = "",
  labelClassName = "",
  errorClassName = "",
  iconWrapperClassName = "",
  className = "",
  id,
  ...rest
}: IInputProps) => {
  // A stable id so <label htmlFor> reaches the input even when the caller passes
  // none. useId is SSR-safe; a random id would break hydration.
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  const inputSize = useMemo(() => {
    const paddingX = icon
      ? iconPosition === "left"
        ? "pl-9 pr-3"
        : "pl-3 pr-9"
      : "px-3";

    const sizeMapping: Record<InputSizeType, string> = {
      sm: `${paddingX} py-1 text-sm`,
      md: `${paddingX} py-1.5 text-base`,
      lg: `${paddingX} py-2 text-lg`,
    };

    return sizeMapping[inputElSize] || sizeMapping.md;
  }, [icon, iconPosition, inputElSize]);

  const inputRounded = useMemo(() => {
    const roundedMapping: Record<InputRoundedType, string> = {
      default: "rounded-md",
      rounded: "rounded-lg",
    };

    return roundedMapping[rounded] || roundedMapping.default;
  }, [rounded]);

  const borderAndRing = error
    ? "border-danger focus:ring-3 focus:ring-danger/20"
    : "border-border-color focus:border-border-strong focus:ring-3 focus:ring-ring";

  return (
    <div className={`flex w-full flex-col gap-1 ${wrapperClassName}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className={`text-sm font-medium text-text-color ${labelClassName}`}
        >
          {label}
        </label>
      ) : null}

      <div className="relative flex w-full items-center">
        {icon ? (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute flex text-muted-text ${
              iconPosition === "left" ? "left-3" : "right-3"
            } ${iconWrapperClassName}`}
          >
            {icon}
          </span>
        ) : null}

        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full border bg-surface text-text-color outline-none transition placeholder:text-subtle-text disabled:cursor-not-allowed disabled:opacity-50 ${inputSize} ${inputRounded} ${borderAndRing} ${className}`}
          {...rest}
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

export default Input;
