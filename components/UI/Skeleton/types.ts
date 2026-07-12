import { HTMLAttributes } from "react";

export type SkeletonShapeType = "text" | "block" | "circle";

export interface ISkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShapeType;
  /** Number of lines. Only meaningful for shape="text". */
  lines?: number;
  wrapperClassName?: string;
}
