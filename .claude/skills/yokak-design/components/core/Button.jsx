import React from "react";

/**
 * Primary action control for the THEQC interface.
 */
export function Button({
  variant = "primary",   // primary | secondary | ghost | gradient | danger
  size = "md",           // sm | md | lg
  as = "button",
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  disabled = false,
  style = {},
  children,
  ...rest
}) {
  const Tag = as;

  const sizes = {
    sm: { pad: "8px 14px", fs: "var(--fs-sm)", gap: "6px", radius: "var(--radius-sm)" },
    md: { pad: "11px 20px", fs: "var(--fs-body)", gap: "8px", radius: "var(--radius-md)" },
    lg: { pad: "14px 28px", fs: "var(--fs-lead)", gap: "10px", radius: "var(--radius-md)" },
  };
  const s = sizes[size] || sizes.md;

  const base = {
    display: fullWidth ? "flex" : "inline-flex",
    width: fullWidth ? "100%" : "auto",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    padding: s.pad,
    fontFamily: "var(--font-primary)",
    fontWeight: "var(--fw-medium)",
    fontSize: s.fs,
    lineHeight: 1,
    borderRadius: s.radius,
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  const variants = {
    primary: {
      background: "var(--yokak-blue-600)",
      color: "var(--white)",
    },
    secondary: {
      background: "var(--white)",
      color: "var(--yokak-blue-800)",
      borderColor: "var(--yokak-blue-600)",
    },
    ghost: {
      background: "transparent",
      color: "var(--yokak-blue-700, var(--yokak-blue-800))",
    },
    gradient: {
      background: "var(--yokak-gradient)",
      color: "var(--white)",
    },
    danger: {
      background: "var(--danger)",
      color: "var(--white)",
    },
  };

  const hoverClass = `yk-btn-${variant}`;

  return (
    <>
      <style>{`
        .yk-btn-primary:not([disabled]):hover { background: var(--yokak-blue-800) !important; }
        .yk-btn-primary:not([disabled]):active { transform: translateY(1px); }
        .yk-btn-secondary:not([disabled]):hover { background: var(--yokak-blue-50) !important; border-color: var(--yokak-blue-800) !important; }
        .yk-btn-secondary:not([disabled]):active { transform: translateY(1px); }
        .yk-btn-ghost:not([disabled]):hover { background: var(--yokak-blue-50) !important; }
        .yk-btn-gradient:not([disabled]):hover { box-shadow: var(--shadow-brand) !important; }
        .yk-btn-gradient:not([disabled]):active { transform: translateY(1px); }
        .yk-btn-danger:not([disabled]):hover { filter: brightness(0.92); }
      `}</style>
      <Tag
        className={hoverClass}
        disabled={as === "button" ? disabled : undefined}
        aria-disabled={disabled || undefined}
        style={{ ...base, ...variants[variant], ...style }}
        {...rest}
      >
        {iconLeft}
        {children}
        {iconRight}
      </Tag>
    </>
  );
}
