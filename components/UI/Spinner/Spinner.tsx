import { useMemo } from "react";

import { ISpinnerProps, SpinnerSizeType } from "./types";

/**
 * Borders are drawn from `currentColor`, so the spinner inherits whatever text
 * color it sits in — that is what lets it work inside every Button variant
 * without a variant prop of its own.
 */
const Spinner = ({ size = "md", className = "", ...rest }: ISpinnerProps) => {
  const spinnerSize = useMemo(() => {
    const sizeMapping: Record<SpinnerSizeType, string> = {
      xs: "size-3 border-2",
      sm: "size-4 border-2",
      md: "size-5 border-2",
      lg: "size-6 border-[3px]",
    };

    return sizeMapping[size] || sizeMapping.md;
  }, [size]);

  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent ${spinnerSize} ${className}`}
      {...rest}
    />
  );
};

export default Spinner;
