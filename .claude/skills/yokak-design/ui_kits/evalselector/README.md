# UI Kit — Değerlendirici Seçim Sistemi (evalselector), YÖKAK-branded

A YÖKAK/THEQC re-skin of the evaluator-selection app
(`rumiexile/evalselector`). The app is a browser-only vanilla HTML/CSS/JS
tool with two modules — evaluator screening and team building. This kit
re-skins it against the design system: the three institutional blues, the
signature gradient topbar, Camber (UI) + DIN Pro (data/numerals), soft cool
shadows, and the official white logo lockup.

## Files
- `style.css` — **drop-in replacement** for the app's `css/style.css`. Every
  original class selector is preserved, so no JS/HTML logic changes are
  needed — the whole app re-skins on swap.
- `index.html` — static preview of Module 1 (Değerlendirici Seçimi) with the
  branded topbar + sample data, so the look can be reviewed here.

## Installing into the evalselector repo
1. Copy `style.css` → the repo's `css/style.css`.
2. Copy `assets/fonts/` (Camber + DIN Pro) and `assets/logos/` into the repo
   root (so `../assets/...` resolves from `css/`).
3. In the copied `style.css`, change every `../../assets/` → `../assets/`
   (this preview lives two levels deep; the repo's css/ is one level deep).
4. In `index.html`'s `<header class="topbar">`, wrap the title in the logo
   lockup:
   ```html
   <div class="topbar-lockup">
     <img class="topbar-logo" src="assets/logos/theqc-logo-en-white.png" alt="YÖKAK / THEQC" />
     <div>
       <h1>Değerlendirici Seçim Sistemi</h1>
       <p class="sub">…</p>
     </div>
   </div>
   ```

No functional code is touched — this is purely a cosmetic brand layer.
