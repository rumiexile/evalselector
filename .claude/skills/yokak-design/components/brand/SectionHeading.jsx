import React from "react";

/**
 * Eyebrow + title heading with the signature gradient rule underneath —
 * the recurring section-opener motif from the identity guidelines.
 */
export function SectionHeading({ eyebrow = null, title, align = "left", style = {}, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", gap: "10px", ...style }} {...rest}>
      {eyebrow && (
        <span
          style={{
            fontFamily: "var(--font-secondary)",
            fontSize: "var(--fs-xs)",
            fontWeight: "var(--fw-medium)",
            letterSpacing: "var(--ls-eyebrow)",
            textTransform: "uppercase",
            color: "var(--yokak-blue-600)",
          }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-primary)",
          fontWeight: "var(--fw-bold)",
          fontSize: "var(--fs-h2)",
          lineHeight: "var(--lh-heading)",
          letterSpacing: "var(--ls-tight)",
          color: "var(--text-strong)",
          textAlign: align,
        }}
      >
        {title}
      </h2>
      <span
        aria-hidden="true"
        style={{ width: "56px", height: "var(--rule-accent-height)", borderRadius: "2px", background: "var(--yokak-gradient)" }}
      />
    </div>
  );
}
