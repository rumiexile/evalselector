import React from "react";

/**
 * Official YÖKAK / THEQC logo lockup — real artwork from the
 * "Yeni Nesil Logo Paketi" (new-generation logo package).
 *
 * Renders the supplied PNG assets; never redraw the mark.
 * Assets live in assets/logos/ at the design-system root.
 */
export function Logotype({
  lang = "en",            // en | tr — English (THEQC) or Turkish (YÖKAK) lockup
  variant = "primary",    // primary (color) | reversed (white) | mono (black)
  size = "md",            // sm | md | lg — height presets
  height = null,          // explicit pixel height overrides size
  assetBase = null,       // override path to assets/logos (for consuming projects)
  style = {},
  ...rest
}) {
  const heights = { sm: 28, md: 40, lg: 64 };
  const h = height || heights[size] || heights.md;

  // Resolve the asset directory: explicit override, global hint, or default.
  const base =
    assetBase ||
    (typeof window !== "undefined" && window.YOKAK_ASSET_BASE) ||
    "assets/logos";

  const files = {
    en: {
      primary: "theqc-logo-en.png",
      reversed: "theqc-logo-en-white.png",
      mono: "theqc-logo-en-black.png",
    },
    tr: {
      primary: "yokak-logo-tr.png",
      reversed: "yokak-logo-tr-white.png",
      mono: "yokak-logo-tr-black.png",
    },
  };
  const file = (files[lang] || files.en)[variant] || files.en.primary;
  const alt =
    lang === "tr"
      ? "Yükseköğretim Kalite Kurulu"
      : "Turkish Higher Education Quality Council";

  return (
    <img
      src={`${base}/${file}`}
      alt={alt}
      style={{ height: h, width: "auto", display: "inline-block", ...style }}
      {...rest}
    />
  );
}
