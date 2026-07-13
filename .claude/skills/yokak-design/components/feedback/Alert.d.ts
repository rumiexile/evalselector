import type { CSSProperties, ReactNode, HTMLAttributes } from "react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string | null;
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function Alert(props: AlertProps): JSX.Element;
