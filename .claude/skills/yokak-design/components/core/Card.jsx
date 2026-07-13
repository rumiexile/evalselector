import React from "react";

/**
 * Generic content surface — white, hairline border, soft shadow.
 */
export function Card({
  padded = true,
  selected = false,
  as = "div",
  children,
  style = {},
  ...rest
}) {
  const Tag = as;
  return (
    <Tag
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${selected ? "var(--border-brand)" : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: padded ? "var(--space-6)" : 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
