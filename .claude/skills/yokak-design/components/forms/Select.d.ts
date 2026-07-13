import type { CSSProperties, SelectHTMLAttributes, ReactNode } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | null;
  hint?: string | null;
  size?: "sm" | "md";
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function Select(props: SelectProps): JSX.Element;
