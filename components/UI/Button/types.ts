import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariantType = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSizeType = "xs" | "sm" | "md" | "lg" | "square-icon";
export type ButtonRoundedType = "default" | "rounded" | "circle";
export type ButtonIconPositionType = "left" | "right";

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariantType;
  size?: ButtonSizeType;
  rounded?: ButtonRoundedType;
  icon?: ReactNode;
  iconPosition?: ButtonIconPositionType;
  isLoading?: boolean;
  buttonContainerClassName?: string;
  buttonContentClassName?: string;
}
