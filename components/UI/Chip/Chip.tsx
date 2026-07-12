import { X } from "lucide-react";
import { PropsWithChildren, useMemo } from "react";

import { ChipSizeType, ChipVariantType, IChipProps } from "./types";

const Chip = ({
  children,
  variant = "default",
  chipSize = "md",
  icon,
  onRemove,
  removeLabel,
  chipContentClassName = "",
  className = "",
  ...rest
}: PropsWithChildren<IChipProps>) => {
  const chipVariant = useMemo(() => {
    const variantMapping: Record<ChipVariantType, string> = {
      default: "bg-surface border border-border-color text-text-color",
      active: "bg-primary border border-primary text-primary-foreground",
      danger: "bg-danger-bg border border-danger/30 text-danger",
      success: "bg-success-bg border border-success/30 text-success",
      info: "bg-info-bg border border-info/30 text-info",
    };

    return variantMapping[variant] || variantMapping.default;
  }, [variant]);

  const chipSizing = useMemo(() => {
    const sizeMapping: Record<ChipSizeType, string> = {
      sm: "gap-1 px-2 py-0.5 text-xs",
      md: "gap-1.5 px-2.5 py-1 text-sm",
    };

    return sizeMapping[chipSize] || sizeMapping.md;
  }, [chipSize]);

  return (
    <span
      className={`inline-flex items-center rounded-full ${chipVariant} ${chipSizing} ${className}`}
      {...rest}
    >
      {icon}
      <span className={chipContentClassName}>{children}</span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel || "Remove"}
          className="-mr-0.5 flex cursor-pointer rounded-full p-0.5 opacity-70 outline-none transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
};

export default Chip;
