import React from "react";

/**
 * Inline notice banner — info, success, warning, danger.
 */
export function Alert({ tone = "info", title = null, children, style = {}, ...rest }) {
  const tones = {
    info:    { bg: "var(--info-tint)", fg: "var(--yokak-blue-800)", bd: "var(--yokak-blue-100)" },
    success: { bg: "var(--success-tint)", fg: "var(--success)", bd: "var(--success-tint)" },
    warning: { bg: "var(--warning-tint)", fg: "var(--warning)", bd: "var(--warning-tint)" },
    danger:  { bg: "var(--danger-tint)", fg: "var(--danger)", bd: "var(--danger-tint)" },
  };
  const t = tones[tone] || tones.info;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: t.bg,
        border: `1px solid ${t.bd}`,
        ...style,
      }}
      {...rest}
    >
      <span style={{ width: "4px", borderRadius: "2px", background: t.fg, flex: "none" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {title && (
          <strong style={{ fontFamily: "var(--font-primary)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-body)", color: t.fg }}>
            {title}
          </strong>
        )}
        <span style={{ fontFamily: "var(--font-primary)", fontSize: "var(--fs-sm)", color: "var(--text-body)", lineHeight: "var(--lh-snug)" }}>
          {children}
        </span>
      </div>
    </div>
  );
}
