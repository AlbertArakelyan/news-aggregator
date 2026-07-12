import { HTMLAttributes } from "react";

export type SpinnerSizeType = "xs" | "sm" | "md" | "lg";

export interface ISpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSizeType;
}
