import { HTMLAttributes, ReactNode } from "react";

export type EmptyStateVariantType = "default" | "danger";

// `title` is omitted from the native attributes for the same reason as Drawer:
// HTMLAttributes types it as `string` (the tooltip), here it is a ReactNode.
export interface IEmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  variant?: EmptyStateVariantType;
  /** Call to action — typically a Button. */
  action?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
}
