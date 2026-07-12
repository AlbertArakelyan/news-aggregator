import { InputHTMLAttributes, ReactNode } from "react";

export type InputSizeType = "sm" | "md" | "lg";
export type InputRoundedType = "default" | "rounded";
export type InputIconPositionType = "left" | "right";

export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: ReactNode;
  icon?: ReactNode;
  iconPosition?: InputIconPositionType;
  /** Named around the native `size` attribute on <input>, which is a number. */
  inputElSize?: InputSizeType;
  rounded?: InputRoundedType;
  wrapperClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  iconWrapperClassName?: string;
}
