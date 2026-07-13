import type { ReactNode, CSSProperties, HTMLAttributes, ElementType } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether internal padding is applied. Default true. */
  padded?: boolean;
  /** Selected state swaps border to brand blue. Default false. */
  selected?: boolean;
  /** Element/tag to render as. Default "div". */
  as?: ElementType;
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function Card(props: CardProps): JSX.Element;
