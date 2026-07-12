import { useMemo } from "react";

import { ISkeletonProps, SkeletonShapeType } from "./types";

const Skeleton = ({
  shape = "block",
  lines = 1,
  wrapperClassName = "",
  className = "",
  ...rest
}: ISkeletonProps) => {
  const skeletonShape = useMemo(() => {
    const shapeMapping: Record<SkeletonShapeType, string> = {
      text: "h-4 rounded",
      block: "h-24 rounded-lg",
      circle: "size-10 rounded-full",
    };

    return shapeMapping[shape] || shapeMapping.block;
  }, [shape]);

  const base = `animate-pulse bg-surface-hover ${skeletonShape}`;

  if (shape === "text" && lines > 1) {
    return (
      <div
        aria-hidden="true"
        className={`flex flex-col gap-2 ${wrapperClassName}`}
      >
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            // Last line short, the way real wrapped text ends.
            className={`${base} ${index === lines - 1 ? "w-2/3" : "w-full"} ${className}`}
            {...rest}
          />
        ))}
      </div>
    );
  }

  return <div aria-hidden="true" className={`${base} ${className}`} {...rest} />;
};

export default Skeleton;
