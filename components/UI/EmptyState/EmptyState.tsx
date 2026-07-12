import { useMemo } from "react";

import { EmptyStateVariantType, IEmptyStateProps } from "./types";

/**
 * Covers both "nothing found" and "it broke" — they are the same layout, and the
 * only difference is the icon color. Keeping them one component stops the error
 * state from drifting away from the empty state visually.
 */
const EmptyState = ({
  title,
  description,
  icon,
  variant = "default",
  action,
  titleClassName = "",
  descriptionClassName = "",
  className = "",
  ...rest
}: IEmptyStateProps) => {
  const iconColor = useMemo(() => {
    const variantMapping: Record<EmptyStateVariantType, string> = {
      default: "text-subtle-text",
      danger: "text-danger",
    };

    return variantMapping[variant] || variantMapping.default;
  }, [variant]);

  return (
    <div
      role={variant === "danger" ? "alert" : undefined}
      className={`flex flex-col items-center justify-center gap-3 px-6 py-16 text-center ${className}`}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" className={`flex ${iconColor}`}>
          {icon}
        </span>
      ) : null}

      <h2 className={`text-lg font-medium text-text-color ${titleClassName}`}>
        {title}
      </h2>

      {description ? (
        <p
          className={`max-w-sm text-sm text-muted-text ${descriptionClassName}`}
        >
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
};

export default EmptyState;
