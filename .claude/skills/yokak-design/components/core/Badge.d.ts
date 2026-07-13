import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Colour tone. Default "brand". */
  tone?: "brand" | "success" | "warning" | "danger" | "neutral";
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function Badge(props: BadgeProps): JSX.Element;
