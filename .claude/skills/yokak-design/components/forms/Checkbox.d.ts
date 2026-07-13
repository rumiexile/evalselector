import type { CSSProperties, ReactNode } from "react";

export interface CheckboxProps {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  style?: CSSProperties;
}

export declare function Checkbox(props: CheckboxProps): JSX.Element;
