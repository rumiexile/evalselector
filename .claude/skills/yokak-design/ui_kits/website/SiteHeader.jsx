const { Logotype, Button } = window.YKAKDesignSystem_c4c6af;

function SiteHeader({ active = "Home" }) {
  const nav = ["Home", "Corporate", "Evaluation Processes", "Accreditation", "Announcements", "Contact"];
  return (
    <header>
      {/* Utility bar */}
      <div style={{ background: "var(--yokak-blue-800)", color: "var(--white)" }}>
        <div style={{ maxWidth: "var(--container-xl)", margin: "0 auto", padding: "0 var(--space-6)", height: 38, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", letterSpacing: "var(--ls-wide)" }}>
          <span>+90 312 266 38 22</span>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
            <a href="#" style={{ color: "var(--yokak-blue-300)", textDecoration: "none", fontWeight: "var(--fw-medium)" }}>THEQC Management Information System (MIS)</a>
            <span style={{ display: "inline-flex", gap: 8 }}>
              <a href="#" style={{ color: "var(--white)", textDecoration: "none", fontWeight: "var(--fw-bold)" }}>English</a>
              <span style={{ opacity: 0.5 }}>|</span>
              <a href="#" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Türkçe</a>
            </span>
          </div>
        </div>
      </div>
      {/* Logo row + nav */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: "var(--container-xl)", margin: "0 auto", padding: "var(--space-4) var(--space-6)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-6)", flexWrap: "wrap" }}>
          <Logotype lang="en" size="md" assetBase="../../assets/logos" />
          <nav style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
            {nav.map((item) => (
              <a
                key={item}
                href="#"
                className={item === active ? "yk-nav-active" : "yk-nav"}
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "var(--fs-sm)",
                  fontWeight: item === active ? "var(--fw-bold)" : "var(--fw-medium)",
                  color: item === active ? "var(--yokak-blue-800)" : "var(--text-body)",
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  borderBottom: item === active ? "2px solid var(--yokak-blue-600)" : "2px solid transparent",
                }}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <style>{`
        .yk-nav:hover { background: var(--yokak-blue-50); color: var(--yokak-blue-800) !important; }
      `}</style>
    </header>
  );
}

window.SiteHeader = SiteHeader;
