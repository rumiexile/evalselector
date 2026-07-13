/* @ds-bundle: {"format":4,"namespace":"YKAKDesignSystem_c4c6af","components":[{"name":"Logotype","sourcePath":"components/brand/Logotype.jsx"},{"name":"SectionHeading","sourcePath":"components/brand/SectionHeading.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"}],"sourceHashes":{"components/brand/Logotype.jsx":"e4ba56aa269d","components/brand/SectionHeading.jsx":"aac12a0ced19","components/core/Badge.jsx":"591bac3306f6","components/core/Button.jsx":"cbcf9ff57e8b","components/core/Card.jsx":"3b54bc57f183","components/core/Tag.jsx":"87222be09e22","components/feedback/Alert.jsx":"a7a356c2f4a4","components/forms/Checkbox.jsx":"8b07e988ea3b","components/forms/Input.jsx":"895003748cde","components/forms/Radio.jsx":"383985c6a728","components/forms/Select.jsx":"901df20a5257","components/navigation/Breadcrumb.jsx":"2c8bd2b8c1b2","ui_kits/website/HomeSections.jsx":"5cc0eab3ee23","ui_kits/website/SiteFooter.jsx":"37717cc7457e","ui_kits/website/SiteHeader.jsx":"b665f5075f47"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.YKAKDesignSystem_c4c6af = window.YKAKDesignSystem_c4c6af || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logotype.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Official YÖKAK / THEQC logo lockup — real artwork from the
 * "Yeni Nesil Logo Paketi" (new-generation logo package).
 *
 * Renders the supplied PNG assets; never redraw the mark.
 * Assets live in assets/logos/ at the design-system root.
 */
function Logotype({
  lang = "en",
  // en | tr — English (THEQC) or Turkish (YÖKAK) lockup
  variant = "primary",
  // primary (color) | reversed (white) | mono (black)
  size = "md",
  // sm | md | lg — height presets
  height = null,
  // explicit pixel height overrides size
  assetBase = null,
  // override path to assets/logos (for consuming projects)
  style = {},
  ...rest
}) {
  const heights = {
    sm: 28,
    md: 40,
    lg: 64
  };
  const h = height || heights[size] || heights.md;

  // Resolve the asset directory: explicit override, global hint, or default.
  const base = assetBase || typeof window !== "undefined" && window.YOKAK_ASSET_BASE || "assets/logos";
  const files = {
    en: {
      primary: "theqc-logo-en.png",
      reversed: "theqc-logo-en-white.png",
      mono: "theqc-logo-en-black.png"
    },
    tr: {
      primary: "yokak-logo-tr.png",
      reversed: "yokak-logo-tr-white.png",
      mono: "yokak-logo-tr-black.png"
    }
  };
  const file = (files[lang] || files.en)[variant] || files.en.primary;
  const alt = lang === "tr" ? "Yükseköğretim Kalite Kurulu" : "Turkish Higher Education Quality Council";
  return /*#__PURE__*/React.createElement("img", _extends({
    src: `${base}/${file}`,
    alt: alt,
    style: {
      height: h,
      width: "auto",
      display: "inline-block",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Logotype });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logotype.jsx", error: String((e && e.message) || e) }); }

// components/brand/SectionHeading.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Eyebrow + title heading with the signature gradient rule underneath —
 * the recurring section-opener motif from the identity guidelines.
 */
function SectionHeading({
  eyebrow = null,
  title,
  align = "left",
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: align === "center" ? "center" : "flex-start",
      gap: "10px",
      ...style
    }
  }, rest), eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--yokak-blue-600)"
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-primary)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h2)",
      lineHeight: "var(--lh-heading)",
      letterSpacing: "var(--ls-tight)",
      color: "var(--text-strong)",
      textAlign: align
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: "56px",
      height: "var(--rule-accent-height)",
      borderRadius: "2px",
      background: "var(--yokak-gradient)"
    }
  }));
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Small status/label chip — institutional, muted tones.
 */
function Badge({
  tone = "brand",
  // brand | success | warning | danger | neutral
  children,
  style = {},
  ...rest
}) {
  const tones = {
    brand: {
      bg: "var(--yokak-blue-50)",
      fg: "var(--yokak-blue-800)",
      bd: "var(--yokak-blue-100)"
    },
    success: {
      bg: "var(--success-tint)",
      fg: "var(--success)",
      bd: "var(--success-tint)"
    },
    warning: {
      bg: "var(--warning-tint)",
      fg: "var(--warning)",
      bd: "var(--warning-tint)"
    },
    danger: {
      bg: "var(--danger-tint)",
      fg: "var(--danger)",
      bd: "var(--danger-tint)"
    },
    neutral: {
      bg: "var(--grey-100)",
      fg: "var(--grey-700)",
      bd: "var(--grey-200)"
    }
  };
  const t = tones[tone] || tones.brand;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      height: "22px",
      padding: "0 10px",
      borderRadius: "var(--radius-pill)",
      background: t.bg,
      color: t.fg,
      border: `1px solid ${t.bd}`,
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      letterSpacing: "var(--ls-wide)",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Primary action control for the THEQC interface.
 */
function Button({
  variant = "primary",
  // primary | secondary | ghost | gradient | danger
  size = "md",
  // sm | md | lg
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
    sm: {
      pad: "8px 14px",
      fs: "var(--fs-sm)",
      gap: "6px",
      radius: "var(--radius-sm)"
    },
    md: {
      pad: "11px 20px",
      fs: "var(--fs-body)",
      gap: "8px",
      radius: "var(--radius-md)"
    },
    lg: {
      pad: "14px 28px",
      fs: "var(--fs-lead)",
      gap: "10px",
      radius: "var(--radius-md)"
    }
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
    whiteSpace: "nowrap"
  };
  const variants = {
    primary: {
      background: "var(--yokak-blue-600)",
      color: "var(--white)"
    },
    secondary: {
      background: "var(--white)",
      color: "var(--yokak-blue-800)",
      borderColor: "var(--yokak-blue-600)"
    },
    ghost: {
      background: "transparent",
      color: "var(--yokak-blue-700, var(--yokak-blue-800))"
    },
    gradient: {
      background: "var(--yokak-gradient)",
      color: "var(--white)"
    },
    danger: {
      background: "var(--danger)",
      color: "var(--white)"
    }
  };
  const hoverClass = `yk-btn-${variant}`;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, `
        .yk-btn-primary:not([disabled]):hover { background: var(--yokak-blue-800) !important; }
        .yk-btn-primary:not([disabled]):active { transform: translateY(1px); }
        .yk-btn-secondary:not([disabled]):hover { background: var(--yokak-blue-50) !important; border-color: var(--yokak-blue-800) !important; }
        .yk-btn-secondary:not([disabled]):active { transform: translateY(1px); }
        .yk-btn-ghost:not([disabled]):hover { background: var(--yokak-blue-50) !important; }
        .yk-btn-gradient:not([disabled]):hover { box-shadow: var(--shadow-brand) !important; }
        .yk-btn-gradient:not([disabled]):active { transform: translateY(1px); }
        .yk-btn-danger:not([disabled]):hover { filter: brightness(0.92); }
      `), /*#__PURE__*/React.createElement(Tag, _extends({
    className: hoverClass,
    disabled: as === "button" ? disabled : undefined,
    "aria-disabled": disabled || undefined,
    style: {
      ...base,
      ...variants[variant],
      ...style
    }
  }, rest), iconLeft, children, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Generic content surface — white, hairline border, soft shadow.
 */
function Card({
  padded = true,
  selected = false,
  as = "div",
  children,
  style = {},
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      background: "var(--surface-card)",
      border: `1px solid ${selected ? "var(--border-brand)" : "var(--border-subtle)"}`,
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-sm)",
      padding: padded ? "var(--space-6)" : 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Rectangular filter/category tag — used for programme fields, subject areas.
 */
function Tag({
  selected = false,
  onRemove = null,
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
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
      ...style
    }
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRemove,
    "aria-label": "Remove",
    style: {
      all: "unset",
      cursor: "pointer",
      fontSize: "12px",
      lineHeight: 1,
      color: "inherit",
      opacity: 0.7
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Inline notice banner — info, success, warning, danger.
 */
function Alert({
  tone = "info",
  title = null,
  children,
  style = {},
  ...rest
}) {
  const tones = {
    info: {
      bg: "var(--info-tint)",
      fg: "var(--yokak-blue-800)",
      bd: "var(--yokak-blue-100)"
    },
    success: {
      bg: "var(--success-tint)",
      fg: "var(--success)",
      bd: "var(--success-tint)"
    },
    warning: {
      bg: "var(--warning-tint)",
      fg: "var(--warning)",
      bd: "var(--warning-tint)"
    },
    danger: {
      bg: "var(--danger-tint)",
      fg: "var(--danger)",
      bd: "var(--danger-tint)"
    }
  };
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: "flex",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: "var(--radius-md)",
      background: t.bg,
      border: `1px solid ${t.bd}`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: "4px",
      borderRadius: "2px",
      background: t.fg,
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    }
  }, title && /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: "var(--font-primary)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-body)",
      color: t.fg
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-primary)",
      fontSize: "var(--fs-sm)",
      color: "var(--text-body)",
      lineHeight: "var(--lh-snug)"
    }
  }, children)));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox with label — square, brand-blue when checked.
 */
function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  style = {},
  id,
  ...rest
}) {
  const boxId = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: boxId,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      fontFamily: "var(--font-primary)",
      fontSize: "var(--fs-body)",
      color: "var(--text-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: boxId,
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: "18px",
      height: "18px"
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: "18px",
      height: "18px",
      flex: "none",
      borderRadius: "var(--radius-sm)",
      border: `1.5px solid ${checked ? "var(--yokak-blue-600)" : "var(--border-strong)"}`,
      background: checked ? "var(--yokak-blue-600)" : "var(--white)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)"
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "9",
    viewBox: "0 0 11 9",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 4.5L4 7.5L10 1",
    stroke: "white",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Text input field with optional label, hint, and error state.
 */
function Input({
  label = null,
  hint = null,
  error = null,
  size = "md",
  // sm | md
  style = {},
  id,
  ...rest
}) {
  const inputId = id || React.useId();
  const pad = size === "sm" ? "8px 12px" : "11px 14px";
  const fs = size === "sm" ? "var(--fs-sm)" : "var(--fs-body)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      letterSpacing: "var(--ls-wide)",
      color: "var(--text-muted)",
      textTransform: "uppercase"
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    style: {
      fontFamily: "var(--font-primary)",
      fontSize: fs,
      color: "var(--text-strong)",
      background: "var(--white)",
      border: `1px solid ${error ? "var(--danger)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-sm)",
      padding: pad,
      outline: "none",
      transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)"
    },
    onFocus: e => {
      e.target.style.borderColor = "var(--yokak-blue-600)";
      e.target.style.boxShadow = "var(--focus-shadow)";
    },
    onBlur: e => {
      e.target.style.borderColor = error ? "var(--danger)" : "var(--border-default)";
      e.target.style.boxShadow = "none";
    }
  }, rest)), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      color: error ? "var(--danger)" : "var(--text-faint)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Radio button with label — circular, brand-blue when selected.
 */
function Radio({
  label,
  checked,
  onChange,
  name,
  disabled = false,
  style = {},
  id,
  ...rest
}) {
  const boxId = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: boxId,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      fontFamily: "var(--font-primary)",
      fontSize: "var(--fs-body)",
      color: "var(--text-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: boxId,
    type: "radio",
    name: name,
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: "18px",
      height: "18px"
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: "18px",
      height: "18px",
      flex: "none",
      borderRadius: "50%",
      border: `1.5px solid ${checked ? "var(--yokak-blue-600)" : "var(--border-strong)"}`,
      background: "var(--white)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "border-color var(--dur-fast) var(--ease-standard)"
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: "9px",
      height: "9px",
      borderRadius: "50%",
      background: "var(--yokak-blue-600)"
    }
  })), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Native select field styled to match Input.
 */
function Select({
  label = null,
  hint = null,
  size = "md",
  // sm | md
  children,
  style = {},
  id,
  ...rest
}) {
  const selectId = id || React.useId();
  const pad = size === "sm" ? "8px 32px 8px 12px" : "11px 36px 11px 14px";
  const fs = size === "sm" ? "var(--fs-sm)" : "var(--fs-body)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: selectId,
    style: {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      letterSpacing: "var(--ls-wide)",
      color: "var(--text-muted)",
      textTransform: "uppercase"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selectId,
    style: {
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
      cursor: "pointer"
    }
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "var(--text-faint)",
      fontSize: "10px",
      pointerEvents: "none"
    }
  }, "\u25BC")), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      color: "var(--text-faint)"
    }
  }, hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Breadcrumb trail — used atop institutional profile / report pages.
 */
function Breadcrumb({
  items = [],
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    "aria-label": "Breadcrumb",
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("ol", {
    style: {
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
      textTransform: "uppercase"
    }
  }, items.map((item, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "6px"
      }
    }, item.href && !last ? /*#__PURE__*/React.createElement("a", {
      href: item.href,
      style: {
        color: "var(--text-link)",
        textDecoration: "none"
      }
    }, item.label) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: last ? "var(--text-strong)" : "var(--text-muted)"
      }
    }, item.label), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-faint)"
      }
    }, "/"));
  })));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomeSections.jsx
try { (() => {
const {
  Button,
  Card,
  Badge,
  SectionHeading
} = window.YKAKDesignSystem_c4c6af;
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--yokak-gradient)",
      color: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-xl)",
      margin: "0 auto",
      padding: "var(--space-16) var(--space-6)",
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr",
      gap: "var(--space-12)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 10px",
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--yokak-blue-300)"
    }
  }, "Turkish Higher Education Quality Council"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "0 0 14px",
      fontFamily: "var(--font-primary)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h1)",
      lineHeight: "var(--lh-heading)",
      letterSpacing: "var(--ls-tight)",
      color: "var(--white)"
    }
  }, "Quality assurance and accreditation in Turkish higher education"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 24px",
      fontSize: "var(--fs-lead)",
      lineHeight: "var(--lh-snug)",
      color: "rgba(255,255,255,0.85)",
      maxWidth: "48ch"
    }
  }, "The Council carries out external evaluation of higher education institutions and authorises independent accreditation agencies."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Institutional Accreditation"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    style: {
      color: "var(--white)"
    }
  }, "Evaluation Programs \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-3)"
    }
  }, [["208", "evaluated institutions"], ["21", "authorised agencies"], ["2015", "established"], ["ENQA", "affiliate member"]].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-secondary)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h2)"
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      letterSpacing: "var(--ls-wide)",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.75)"
    }
  }, l))))));
}
function News() {
  const items = [{
    date: "27 Jun 2026",
    tag: "Accreditation",
    title: "Institutional Accreditation Certificates presented to Abdullah Gül, Çukurova and Çağ Universities"
  }, {
    date: "18 Mar 2026",
    tag: "Training",
    title: "Quality Ambassadors Training Program (KEP'26) for higher-education students"
  }, {
    date: "15 Jan 2026",
    tag: "Announcement",
    title: "Training meeting held for Quality Commissions on Institutional Self-Evaluation Reports (KİDR)"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-xl)",
      margin: "0 auto",
      padding: "var(--space-16) var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: "var(--space-8)"
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Latest",
    title: "News & Announcements"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "All announcements \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "var(--space-5)"
    }
  }, items.map(it => /*#__PURE__*/React.createElement(Card, {
    key: it.title,
    padded: false,
    style: {
      overflow: "hidden",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 140,
      background: "var(--surface-sunken)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      letterSpacing: "var(--ls-wide)",
      color: "var(--text-faint)",
      textTransform: "uppercase"
    }
  }, "Photo"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-2)",
      alignItems: "center",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand"
  }, it.tag), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      color: "var(--text-faint)"
    }
  }, it.date)), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-primary)",
      fontWeight: "var(--fw-medium)",
      fontSize: "var(--fs-h4)",
      lineHeight: "var(--lh-snug)",
      color: "var(--text-strong)"
    }
  }, it.title)))))));
}
function Documents() {
  const docs = [["Institutional Self-Evaluation Report Writing Guide", "Version 3.2 · 2026"], ["Institutional External Evaluation and Accreditation Criteria", "Version 3.1"], ["Evaluation Programs Guide", "Version 3.1.1 (Updated)"]];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-subtle)",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-xl)",
      margin: "0 auto",
      padding: "var(--space-16) var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    eyebrow: "Documents",
    title: "National Evaluation Programs",
    style: {
      marginBottom: "var(--space-8)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)",
      maxWidth: "var(--container-md)"
    }
  }, docs.map(([t, v]) => /*#__PURE__*/React.createElement(Card, {
    key: t,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      padding: "var(--space-4) var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-primary)",
      fontWeight: "var(--fw-medium)",
      fontSize: "var(--fs-body)",
      color: "var(--text-strong)"
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      color: "var(--text-faint)",
      marginTop: 2
    }
  }, v)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Download"))))));
}
Object.assign(window, {
  Hero,
  News,
  Documents
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomeSections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteFooter.jsx
try { (() => {
const {
  Logotype
} = window.YKAKDesignSystem_c4c6af;
function SiteFooter() {
  const cols = [{
    h: "Corporate",
    links: ["About the Council", "Council Members", "Organisation", "Legislation"]
  }, {
    h: "Processes",
    links: ["Institutional Accreditation", "Evaluation Programs", "Authorised Agencies", "Reports"]
  }, {
    h: "Contact",
    links: ["Üniversiteler Mah. 1600 Cad. No:10", "06800 Çankaya / Ankara — Türkiye", "+90 312 266 38 22", "yokak@yokak.gov.tr"]
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--yokak-blue-800)",
      color: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-xl)",
      margin: "0 auto",
      padding: "var(--space-12) var(--space-6)",
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr",
      gap: "var(--space-10)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Logotype, {
    lang: "en",
    variant: "reversed",
    size: "md",
    assetBase: "../../assets/logos"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "16px 0 0",
      fontFamily: "var(--font-primary)",
      fontSize: "var(--fs-sm)",
      lineHeight: "var(--lh-body)",
      color: "rgba(255,255,255,0.7)",
      maxWidth: "36ch"
    }
  }, "Independent public body for external quality assurance and accreditation of Turkish higher education.")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.h
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: "0 0 12px",
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-medium)",
      letterSpacing: "var(--ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--yokak-blue-300)"
    }
  }, c.h), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, c.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontFamily: "var(--font-primary)",
      fontSize: "var(--fs-sm)",
      color: "rgba(255,255,255,0.85)",
      textDecoration: "none"
    }
  }, l))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid rgba(255,255,255,0.15)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-xl)",
      margin: "0 auto",
      padding: "var(--space-4) var(--space-6)",
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      color: "rgba(255,255,255,0.6)"
    }
  }, "\xA9 2026 Y\xFCksek\xF6\u011Fretim Kalite Kurulu / Turkish Higher Education Quality Council")));
}
window.SiteFooter = SiteFooter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteHeader.jsx
try { (() => {
const {
  Logotype,
  Button
} = window.YKAKDesignSystem_c4c6af;
function SiteHeader({
  active = "Home"
}) {
  const nav = ["Home", "Corporate", "Evaluation Processes", "Accreditation", "Announcements", "Contact"];
  return /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--yokak-blue-800)",
      color: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-xl)",
      margin: "0 auto",
      padding: "0 var(--space-6)",
      height: 38,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontFamily: "var(--font-secondary)",
      fontSize: "var(--fs-xs)",
      letterSpacing: "var(--ls-wide)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "+90 312 266 38 22"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: "var(--yokak-blue-300)",
      textDecoration: "none",
      fontWeight: "var(--fw-medium)"
    }
  }, "THEQC Management Information System (MIS)"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: "var(--white)",
      textDecoration: "none",
      fontWeight: "var(--fw-bold)"
    }
  }, "English"), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.5
    }
  }, "|"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: "rgba(255,255,255,0.7)",
      textDecoration: "none"
    }
  }, "T\xFCrk\xE7e"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-xl)",
      margin: "0 auto",
      padding: "var(--space-4) var(--space-6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-6)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Logotype, {
    lang: "en",
    size: "md",
    assetBase: "../../assets/logos"
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: "var(--space-1)",
      flexWrap: "wrap"
    }
  }, nav.map(item => /*#__PURE__*/React.createElement("a", {
    key: item,
    href: "#",
    className: item === active ? "yk-nav-active" : "yk-nav",
    style: {
      fontFamily: "var(--font-primary)",
      fontSize: "var(--fs-sm)",
      fontWeight: item === active ? "var(--fw-bold)" : "var(--fw-medium)",
      color: item === active ? "var(--yokak-blue-800)" : "var(--text-body)",
      textDecoration: "none",
      padding: "10px 12px",
      borderRadius: "var(--radius-sm)",
      borderBottom: item === active ? "2px solid var(--yokak-blue-600)" : "2px solid transparent"
    }
  }, item))))), /*#__PURE__*/React.createElement("style", null, `
        .yk-nav:hover { background: var(--yokak-blue-50); color: var(--yokak-blue-800) !important; }
      `));
}
window.SiteHeader = SiteHeader;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteHeader.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Logotype = __ds_scope.Logotype;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

})();
