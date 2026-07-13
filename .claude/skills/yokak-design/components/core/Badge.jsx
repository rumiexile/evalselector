import React from "react";

/**
 * Small status/label chip — institutional, muted tones.
 */
export function Badge({
  tone = "brand",   // brand | success | warning | danger | neutral
  children,
  style = {},
  ...rest
}) {
  const tones = {
    brand:   { bg: "var(--yokak-blue-50)", fg: "var(--yokak-blue-800)", bd: "var(--yokak-blue-100)" },
    success: { bg: "var(--success-tint)", fg: "var(--success)", bd: "var(--success-tint)" },
    warning: { bg: "var(--warning-tint)", fg: "var(--warning)", bd: "var(--warning-tint)" },
    danger:  { bg: "var(--danger-tint)", fg: "var(--danger)", bd: "var(--danger-tint)" },
    neutral: { bg: "var(--grey-100)", fg: "var(--grey-700)", bd: "var(--grey-200)" },
  };
  const t = tones[tone] || tones.brand;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "22px",
        padding: "0 10px",
        borderRadius: "var(--radius-pill)",
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        fontFamily: "var(--font-secondary)",
        fontSize: "var(--fs-xs)",
        fontWeight: "var(--fw-medium)",
        letterSpacing: "var(--ls-wide)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
