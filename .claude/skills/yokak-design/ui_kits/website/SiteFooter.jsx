const { Logotype } = window.YKAKDesignSystem_c4c6af;

function SiteFooter() {
  const cols = [
    { h: "Corporate", links: ["About the Council", "Council Members", "Organisation", "Legislation"] },
    { h: "Processes", links: ["Institutional Accreditation", "Evaluation Programs", "Authorised Agencies", "Reports"] },
    { h: "Contact", links: ["Üniversiteler Mah. 1600 Cad. No:10", "06800 Çankaya / Ankara — Türkiye", "+90 312 266 38 22", "yokak@yokak.gov.tr"] },
  ];
  return (
    <footer style={{ background: "var(--yokak-blue-800)", color: "var(--white)" }}>
      <div style={{ maxWidth: "var(--container-xl)", margin: "0 auto", padding: "var(--space-12) var(--space-6)", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr", gap: "var(--space-10)" }}>
        <div>
          <Logotype lang="en" variant="reversed" size="md" assetBase="../../assets/logos" />
          <p style={{ margin: "16px 0 0", fontFamily: "var(--font-primary)", fontSize: "var(--fs-sm)", lineHeight: "var(--lh-body)", color: "rgba(255,255,255,0.7)", maxWidth: "36ch" }}>
            Independent public body for external quality assurance and accreditation of Turkish higher education.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <h4 style={{ margin: "0 0 12px", fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-medium)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--yokak-blue-300)" }}>{c.h}</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {c.links.map((l) => (
                <li key={l}><a href="#" style={{ fontFamily: "var(--font-primary)", fontSize: "var(--fs-sm)", color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ maxWidth: "var(--container-xl)", margin: "0 auto", padding: "var(--space-4) var(--space-6)", fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", color: "rgba(255,255,255,0.6)" }}>
          © 2026 Yükseköğretim Kalite Kurulu / Turkish Higher Education Quality Council
        </div>
      </div>
    </footer>
  );
}

window.SiteFooter = SiteFooter;
