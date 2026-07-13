import type { ReactNode, CSSProperties, HTMLAttributes } from "react";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Selected/active state. Default false. */
  selected?: boolean;
  /** Optional remove handler — renders a small × button. */
  onRemove?: (() => void) | null;
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function Tag(props: TagProps): JSX.Element;
