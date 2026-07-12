import { ReactNode, SelectHTMLAttributes } from "react";

export type SelectSizeType = "sm" | "md" | "lg";
export type SelectRoundedType = "default" | "rounded";

export interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ISelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  error?: ReactNode;
  options: ISelectOption[];
  /** Rendered as a disabled leading option — a placeholder, not a real value. */
  placeholder?: string;
  /** Named around the native `size` attribute on <select>, which is a number. */
  selectElSize?: SelectSizeType;
  rounded?: SelectRoundedType;
  wrapperClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}
