import type { CSSProperties, ReactNode } from "react";

export interface RadioProps {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

export declare function Radio(props: RadioProps): JSX.Element;
