import type { CSSProperties, InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Uppercase field label. */
  label?: string | null;
  /** Helper text below the field. */
  hint?: string | null;
  /** Error message — overrides hint and switches to danger colour. */
  error?: string | null;
  /** Field height. Default "md". */
  size?: "sm" | "md";
  style?: CSSProperties;
}

export declare function Input(props: InputProps): JSX.Element;
