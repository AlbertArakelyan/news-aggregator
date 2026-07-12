import { PropsWithChildren, useMemo } from "react";

import { CardPaddingType, CardVariantType, ICardProps } from "./types";

const Card = ({
  children,
  variant = "surface",
  padding = "md",
  isInteractive = false,
  className = "",
  ...rest
}: PropsWithChildren<ICardProps>) => {
  const cardVariant = useMemo(() => {
    const variantMapping: Record<CardVariantType, string> = {
      surface: "bg-surface border border-border-color",
      sunken: "bg-surface-sunken border border-border-color",
      outline: "bg-transparent border border-border-color",
    };

    return variantMapping[variant] || variantMapping.surface;
  }, [variant]);

  const cardPadding = useMemo(() => {
    const paddingMapping: Record<CardPaddingType, string> = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    return paddingMapping[padding] || paddingMapping.md;
  }, [padding]);

  const interactive = isInteractive
    ? "cursor-pointer transition hover:border-border-strong hover:bg-surface-hover focus-within:ring-3 focus-within:ring-ring"
    : "";

  return (
    <div
      className={`rounded-lg ${cardVariant} ${cardPadding} ${interactive} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
