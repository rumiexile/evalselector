const { Button, Card, Badge, SectionHeading } = window.YKAKDesignSystem_c4c6af;

function Hero() {
  return (
    <section style={{ background: "var(--yokak-gradient)", color: "var(--white)" }}>
      <div style={{ maxWidth: "var(--container-xl)", margin: "0 auto", padding: "var(--space-16) var(--space-6)", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--space-12)", alignItems: "center" }}>
        <div>
          <p style={{ margin: "0 0 10px", fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-medium)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--yokak-blue-300)" }}>Turkish Higher Education Quality Council</p>
          <h1 style={{ margin: "0 0 14px", fontFamily: "var(--font-primary)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h1)", lineHeight: "var(--lh-heading)", letterSpacing: "var(--ls-tight)", color: "var(--white)" }}>
            Quality assurance and accreditation in Turkish higher education
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: "var(--fs-lead)", lineHeight: "var(--lh-snug)", color: "rgba(255,255,255,0.85)", maxWidth: "48ch" }}>
            The Council carries out external evaluation of higher education institutions and authorises independent accreditation agencies.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Button variant="secondary">Institutional Accreditation</Button>
            <Button variant="ghost" style={{ color: "var(--white)" }}>Evaluation Programs →</Button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          {[["208", "evaluated institutions"], ["21", "authorised agencies"], ["2015", "established"], ["ENQA", "affiliate member"]].map(([n, l]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
              <div style={{ fontFamily: "var(--font-secondary)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)" }}>{n}</div>
              <div style={{ fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function News() {
  const items = [
    { date: "27 Jun 2026", tag: "Accreditation", title: "Institutional Accreditation Certificates presented to Abdullah Gül, Çukurova and Çağ Universities" },
    { date: "18 Mar 2026", tag: "Training", title: "Quality Ambassadors Training Program (KEP'26) for higher-education students" },
    { date: "15 Jan 2026", tag: "Announcement", title: "Training meeting held for Quality Commissions on Institutional Self-Evaluation Reports (KİDR)" },
  ];
  return (
    <section style={{ background: "var(--surface-page)" }}>
      <div style={{ maxWidth: "var(--container-xl)", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-8)" }}>
          <SectionHeading eyebrow="Latest" title="News & Announcements" />
          <Button variant="ghost">All announcements →</Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-5)" }}>
          {items.map((it) => (
            <Card key={it.title} padded={false} style={{ overflow: "hidden", cursor: "pointer" }}>
              <div style={{ height: 140, background: "var(--surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", letterSpacing: "var(--ls-wide)", color: "var(--text-faint)", textTransform: "uppercase" }}>Photo</div>
              <div style={{ padding: "var(--space-5)" }}>
                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", marginBottom: 10 }}>
                  <Badge tone="brand">{it.tag}</Badge>
                  <span style={{ fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", color: "var(--text-faint)" }}>{it.date}</span>
                </div>
                <h3 style={{ margin: 0, fontFamily: "var(--font-primary)", fontWeight: "var(--fw-medium)", fontSize: "var(--fs-h4)", lineHeight: "var(--lh-snug)", color: "var(--text-strong)" }}>{it.title}</h3>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Documents() {
  const docs = [
    ["Institutional Self-Evaluation Report Writing Guide", "Version 3.2 · 2026"],
    ["Institutional External Evaluation and Accreditation Criteria", "Version 3.1"],
    ["Evaluation Programs Guide", "Version 3.1.1 (Updated)"],
  ];
  return (
    <section style={{ background: "var(--surface-subtle)", borderTop: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: "var(--container-xl)", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
        <SectionHeading eyebrow="Documents" title="National Evaluation Programs" style={{ marginBottom: "var(--space-8)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: "var(--container-md)" }}>
          {docs.map(([t, v]) => (
            <Card key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", padding: "var(--space-4) var(--space-5)" }}>
              <div>
                <div style={{ fontFamily: "var(--font-primary)", fontWeight: "var(--fw-medium)", fontSize: "var(--fs-body)", color: "var(--text-strong)" }}>{t}</div>
                <div style={{ fontFamily: "var(--font-secondary)", fontSize: "var(--fs-xs)", color: "var(--text-faint)", marginTop: 2 }}>{v}</div>
              </div>
              <Button variant="secondary" size="sm">Download</Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, News, Documents });
