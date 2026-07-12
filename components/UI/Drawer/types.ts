import { HTMLAttributes, ReactNode } from "react";

export type DrawerSideType = "left" | "right" | "bottom";
export type DrawerSizeType = "sm" | "md" | "lg";

// `title` is omitted from the native attributes: HTMLAttributes types it as
// `string` (the tooltip attribute), and here it is a rendered ReactNode heading.
export interface IDrawerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: DrawerSideType;
  drawerSize?: DrawerSizeType;
  /** Set false to keep a click on the backdrop from closing the drawer. */
  closeOnOverlayClick?: boolean;
  overlayClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
}
