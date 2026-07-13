import React from "react";

/**
 * Rectangular filter/category tag — used for programme fields, subject areas.
 */
export function Tag({
  selected = false,
  onRemove = null,
  children,
  style = {},
  ...rest
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        height: "28px",
        padding: "0 10px",
        borderRadius: "var(--radius-sm)",
        background: selected ? "var(--yokak-blue-600)" : "var(--surface-subtle)",
        color: selected ? "var(--white)" : "var(--text-body)",
        border: `1px solid ${selected ? "var(--yokak-blue-600)" : "var(--border-default)"}`,
        fontFamily: "var(--font-primary)",
        fontSize: "var(--fs-sm)",
        fontWeight: "var(--fw-regular)",
        transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)",
        ...style,
      }}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          style={{
            all: "unset",
            cursor: "pointer",
            fontSize: "12px",
            lineHeight: 1,
            color: "inherit",
            opacity: 0.7,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
