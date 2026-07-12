import { HTMLAttributes, ReactNode } from "react";

export interface ICheckboxGroupOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface ICheckboxGroupProps<T extends string>
  extends Omit<HTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  legend?: ReactNode;
  options: ICheckboxGroupOption<T>[];
  selected: T[];
  /** Receives the whole next selection, not a single toggle. */
  onChange: (next: T[]) => void;
  checkboxSize?: "sm" | "md";
  legendClassName?: string;
  optionLabelClassName?: string;
}
