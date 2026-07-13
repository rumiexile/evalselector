import React from "react";

/**
 * Checkbox with label — square, brand-blue when checked.
 */
export function Checkbox({ label, checked, onChange, disabled = false, style = {}, id, ...rest }) {
  const boxId = id || React.useId();
  return (
    <label
      htmlFor={boxId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "var(--font-primary)",
        fontSize: "var(--fs-body)",
        color: "var(--text-body)",
        ...style,
      }}
    >
      <input
        id={boxId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: "18px", height: "18px" }}
        {...rest}
      />
      <span
        aria-hidden="true"
        style={{
          width: "18px",
          height: "18px",
          flex: "none",
          borderRadius: "var(--radius-sm)",
          border: `1.5px solid ${checked ? "var(--yokak-blue-600)" : "var(--border-strong)"}`,
          background: checked ? "var(--yokak-blue-600)" : "var(--white)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)",
        }}
      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
