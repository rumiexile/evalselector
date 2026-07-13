import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: "primary" | "secondary" | "ghost" | "gradient" | "danger";
  /** Size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Element/component to render as (e.g. "a"). @default "button" */
  as?: any;
  /** Leading icon node. */
  iconLeft?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
  /** Stretch to fill container width. @default false */
  fullWidth?: boolean;
}

export declare function Button(props: ButtonProps): JSX.Element;
