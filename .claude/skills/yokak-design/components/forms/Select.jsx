import React from "react";

/**
 * Native select field styled to match Input.
 */
export function Select({
  label = null,
  hint = null,
  size = "md",   // sm | md
  children,
  style = {},
  id,
  ...rest
}) {
  const selectId = id || React.useId();
  const pad = size === "sm" ? "8px 32px 8px 12px" : "11px 36px 11px 14px";
  const fs = size === "sm" ? "var(--fs-sm)" : "var(--fs-body)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontFamily: "var(--font-secondary)",
            fontSize: "var(--fs-xs)",
            fontWeight: "var(--fw-medium)",
            letterSpacing: "var(--ls-wide)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          id={selectId}
          style={{
            width: "100%",
            appearance: "none",
            fontFamily: "var(--font-primary)",
            fontSize: fs,
            color: "var(--text-strong)",
            background: "var(--white)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: pad,
            outline: "none",
            cursor: "pointer",
          }}
          {...rest}
        >
          {children}
        </select>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-faint)",
            fontSize: "10px",
            pointerEvents: "none",
          }}
        >
          ▼
        </span>
      </div>
      {hint && (
        <span style={{ fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", color: "var(--text-faint)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
