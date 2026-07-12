import { X } from "lucide-react";
import { PropsWithChildren, useEffect, useMemo } from "react";

import Button from "@/components/UI/Button/Button";

import { DrawerSideType, DrawerSizeType, IDrawerProps } from "./types";

/**
 * Rendered inline rather than through a portal. That is safe here because no
 * ancestor sets a transform/filter/perspective, which is the only thing that
 * would break `position: fixed`. If one is ever introduced, this must move to
 * createPortal — a fixed panel would start positioning against that ancestor
 * instead of the viewport.
 *
 * Presentational: open/closed is the caller's state, not ours.
 */
const Drawer = ({
  children,
  isOpen,
  onClose,
  title,
  side = "right",
  drawerSize = "md",
  closeOnOverlayClick = true,
  overlayClassName = "",
  panelClassName = "",
  headerClassName = "",
  className = "",
  ...rest
}: PropsWithChildren<IDrawerProps>) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Lock the page behind the drawer; restore exactly what was there before,
    // rather than assuming it was "visible".
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const panelPosition = useMemo(() => {
    const sideMapping: Record<DrawerSideType, string> = {
      left: "inset-y-0 left-0 h-full",
      right: "inset-y-0 right-0 h-full",
      bottom: "inset-x-0 bottom-0 w-full rounded-t-xl",
    };

    return sideMapping[side] || sideMapping.right;
  }, [side]);

  const panelSize = useMemo(() => {
    const horizontal: Record<DrawerSizeType, string> = {
      sm: "w-full max-w-xs",
      md: "w-full max-w-sm",
      lg: "w-full max-w-md",
    };

    const vertical: Record<DrawerSizeType, string> = {
      sm: "max-h-[40vh]",
      md: "max-h-[60vh]",
      lg: "max-h-[80vh]",
    };

    const mapping = side === "bottom" ? vertical : horizontal;

    return mapping[drawerSize] || mapping.md;
  }, [drawerSize, side]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 ${className}`} {...rest}>
      <div
        // Backdrop click is a convenience, not the accessible close path — that
        // is Escape and the close button, both of which are real controls.
        aria-hidden="true"
        onClick={closeOnOverlayClick ? onClose : undefined}
        className={`absolute inset-0 bg-black/50 ${overlayClassName}`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={`absolute flex flex-col overflow-hidden bg-surface shadow-xl ${panelPosition} ${panelSize} ${panelClassName}`}
      >
        {title ? (
          <header
            className={`flex shrink-0 items-center justify-between border-b border-border-color px-4 py-3 ${headerClassName}`}
          >
            <h2 className="text-base font-medium text-text-color">{title}</h2>

            <Button
              variant="ghost"
              size="square-icon"
              rounded="circle"
              onClick={onClose}
              aria-label="Close"
              icon={<X className="size-4" aria-hidden="true" />}
            />
          </header>
        ) : null}

        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;
