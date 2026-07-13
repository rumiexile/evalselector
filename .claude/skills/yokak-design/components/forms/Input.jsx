import React from "react";

/**
 * Text input field with optional label, hint, and error state.
 */
export function Input({
  label = null,
  hint = null,
  error = null,
  size = "md",     // sm | md
  style = {},
  id,
  ...rest
}) {
  const inputId = id || React.useId();
  const pad = size === "sm" ? "8px 12px" : "11px 14px";
  const fs = size === "sm" ? "var(--fs-sm)" : "var(--fs-body)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      {label && (
        <label
          htmlFor={inputId}
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
      <input
        id={inputId}
        style={{
          fontFamily: "var(--font-primary)",
          fontSize: fs,
          color: "var(--text-strong)",
          background: "var(--white)",
          border: `1px solid ${error ? "var(--danger)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-sm)",
          padding: pad,
          outline: "none",
          transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)",
        }}
        onFocus={(e) => { e.target.style.borderColor = "var(--yokak-blue-600)"; e.target.style.boxShadow = "var(--focus-shadow)"; }}
        onBlur={(e) => { e.target.style.borderColor = error ? "var(--danger)" : "var(--border-default)"; e.target.style.boxShadow = "none"; }}
        {...rest}
      />
      {(hint || error) && (
        <span
          style={{
            fontFamily: "var(--font-secondary)",
            fontSize: "var(--fs-xs)",
            color: error ? "var(--danger)" : "var(--text-faint)",
          }}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
