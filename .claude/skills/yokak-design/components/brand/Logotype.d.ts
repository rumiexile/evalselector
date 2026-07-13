import type { CSSProperties, ImgHTMLAttributes } from "react";

export interface LogotypeProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Language lockup: "en" (THEQC) or "tr" (YÖKAK). Default "en". */
  lang?: "en" | "tr";
  /** primary = full colour, reversed = white (on brand blue), mono = black. */
  variant?: "primary" | "reversed" | "mono";
  /** Height preset. Default "md" (40px). */
  size?: "sm" | "md" | "lg";
  /** Explicit pixel height — overrides size. */
  height?: number | null;
  /** Path to the assets/logos directory (relative to the page). */
  assetBase?: string | null;
  style?: CSSProperties;
}

export declare function Logotype(props: LogotypeProps): JSX.Element;
