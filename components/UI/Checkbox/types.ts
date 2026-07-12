import { InputHTMLAttributes, ReactNode } from "react";

export type CheckboxSizeType = "sm" | "md";

export interface ICheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  /** Secondary line under the label — e.g. an article count for a source. */
  description?: ReactNode;
  checkboxSize?: CheckboxSizeType;
  wrapperClassName?: string;
  labelClassName?: string;
  boxClassName?: string;
}
