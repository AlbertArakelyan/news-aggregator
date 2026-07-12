import { HTMLAttributes, ReactNode } from "react";

export type ChipVariantType = "default" | "active" | "danger" | "success" | "info";
export type ChipSizeType = "sm" | "md";

export interface IChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariantType;
  chipSize?: ChipSizeType;
  icon?: ReactNode;
  /** When provided, renders a remove button. Used for active-filter pills. */
  onRemove?: () => void;
  removeLabel?: string;
  chipContentClassName?: string;
}
