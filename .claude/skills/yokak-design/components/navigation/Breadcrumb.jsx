import React from "react";

/**
 * Breadcrumb trail — used atop institutional profile / report pages.
 */
export function Breadcrumb({ items = [], style = {}, ...rest }) {
  return (
    <nav aria-label="Breadcrumb" style={{ ...style }} {...rest}>
      <ol
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "6px",
          margin: 0,
          padding: 0,
          listStyle: "none",
          fontFamily: "var(--font-secondary)",
          fontSize: "var(--fs-xs)",
          letterSpacing: "var(--ls-wide)",
          textTransform: "uppercase",
        }}
      >
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {item.href && !last ? (
                <a href={item.href} style={{ color: "var(--text-link)", textDecoration: "none" }}>
                  {item.label}
                </a>
              ) : (
                <span style={{ color: last ? "var(--text-strong)" : "var(--text-muted)" }}>{item.label}</span>
              )}
              {!last && <span style={{ color: "var(--text-faint)" }}>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
