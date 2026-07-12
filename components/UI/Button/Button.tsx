import { PropsWithChildren, useMemo } from "react";

import Spinner from "@/components/UI/Spinner/Spinner";

import {
  ButtonRoundedType,
  ButtonSizeType,
  ButtonVariantType,
  IButtonProps,
} from "./types";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  rounded = "default",
  icon,
  iconPosition = "left",
  isLoading = false,
  buttonContainerClassName = "",
  buttonContentClassName = "",
  className = "",
  disabled,
  // Default to "button": an unspecified <button> inside a <form> submits it,
  // which is almost never what a caller means.
  type = "button",
  ...rest
}: PropsWithChildren<IButtonProps>) => {
  const buttonSize = useMemo(() => {
    const sizeMapping: Record<ButtonSizeType, string> = {
      xs: "px-2 py-0.5 text-xs",
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-1.5 text-base",
      lg: "px-5 py-2.5 text-lg",
      "square-icon": "p-2",
    };

    return sizeMapping[size] || sizeMapping.md;
  }, [size]);

  const buttonColor = useMemo(() => {
    const variantMapping: Record<ButtonVariantType, string> = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active",
      ghost:
        "bg-transparent text-text-color hover:bg-ghost-hover active:bg-ghost-active",
      danger:
        "bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-active",
    };

    return variantMapping[variant] || variantMapping.primary;
  }, [variant]);

  const buttonRounded = useMemo(() => {
    const roundedMapping: Record<ButtonRoundedType, string> = {
      default: "rounded-md",
      rounded: "rounded-lg",
      circle: "rounded-full",
    };

    return roundedMapping[rounded] || roundedMapping.default;
  }, [rounded]);

  // A gap rather than margins on the label: it spaces the spinner too, which a
  // margin keyed off `icon` would miss when isLoading renders with no icon.
  const hasAdornment = Boolean(icon) || isLoading;
  const contentGap = hasAdornment && children ? "gap-2" : "";

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={`cursor-pointer outline-none transition focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${buttonSize} ${buttonColor} ${buttonRounded} ${className}`}
      {...rest}
    >
      <span
        className={`flex items-center justify-center ${contentGap} ${buttonContainerClassName}`}
      >
        {isLoading ? <Spinner size={size === "lg" ? "md" : "sm"} /> : null}
        {!isLoading && icon && iconPosition === "left" ? icon : null}

        {children ? (
          <span className={buttonContentClassName}>{children}</span>
        ) : null}

        {!isLoading && icon && iconPosition === "right" ? icon : null}
      </span>
    </button>
  );
};

export default Button;
