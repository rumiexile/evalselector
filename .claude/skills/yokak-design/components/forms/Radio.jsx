import React from "react";

/**
 * Radio button with label — circular, brand-blue when selected.
 */
export function Radio({ label, checked, onChange, name, disabled = false, style = {}, id, ...rest }) {
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
        type="radio"
        name={name}
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
          borderRadius: "50%",
          border: `1.5px solid ${checked ? "var(--yokak-blue-600)" : "var(--border-strong)"}`,
          background: "var(--white)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color var(--dur-fast) var(--ease-standard)",
        }}
      >
        {checked && (
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--yokak-blue-600)" }} />
        )}
      </span>
      {label}
    </label>
  );
}
