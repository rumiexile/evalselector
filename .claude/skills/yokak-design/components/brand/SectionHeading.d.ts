import type { CSSProperties, HTMLAttributes } from "react";

export interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string | null;
  title: string;
  align?: "left" | "center";
  style?: CSSProperties;
}

export declare function SectionHeading(props: SectionHeadingProps): JSX.Element;
