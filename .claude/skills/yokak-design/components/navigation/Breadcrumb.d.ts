import type { CSSProperties, HTMLAttributes } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  style?: CSSProperties;
}

export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
