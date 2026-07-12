import { HTMLAttributes } from "react";

export type CardPaddingType = "none" | "sm" | "md" | "lg";
export type CardVariantType = "surface" | "sunken" | "outline";

export interface ICardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariantType;
  padding?: CardPaddingType;
  /** Adds hover/focus affordances. Use when the whole card is a link or button. */
  isInteractive?: boolean;
}
