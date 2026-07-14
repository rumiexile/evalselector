#!/usr/bin/env node
/*
 * update-universities.mjs — js/universities.js içindeki gömülü kurum listesini
 * YÖK Akademik üniversite listesi sayfasından yeniler.
 *
 *   node tools/update-universities.mjs             # sayfayı indir + güncelle
 *   node tools/update-universities.mjs --dry-run   # yalnızca farkı göster
 *   node tools/update-universities.mjs --file a.html  # kaydedilmiş sayfadan güncelle
 *
 * Kaynak: https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp
 * Not: Uygulama tarayıcıda çevrimdışı çalıştığından liste kodda gömülü tutulur;
 * bu araç geliştirme tarafında (ör. Claude/MCP oturumu ya da yerel makine)
 * çalıştırılarak gömülü liste güncel tutulur. Kullanıcılar uygulama içindeki
 * "YÖK listesinden güncelle" penceresiyle de listeyi yenileyebilir.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const UniParse = require(join(kok, "js", "uniparse.js"));
const Universities = require(join(kok, "js", "universities.js"));
const TP = require(join(kok, "js", "textparse.js"));

const URL_ = "https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileIdx = args.indexOf("--file");

async function iceriktenListe() {
  if (fileIdx !== -1) {
    const yol = args[fileIdx + 1];
    if (!yol) { console.error("--file için dosya yolu verin."); process.exit(2); }
    return readFileSync(yol, "utf8");
  }
  console.log("İndiriliyor: " + URL_);
  const res = await fetch(URL_, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "tr-TR,tr;q=0.9"
    }
  });
  if (!res.ok) throw new Error("HTTP " + res.status + " — sayfa alınamadı.");
  return await res.text();
}

function kodUret(liste) {
  const grup = { Devlet: [], "Vakıf": [], diger: [] };
  for (const k of liste) (grup[k.tur] || grup.diger).push(k);
  for (const g of Object.values(grup)) g.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
  const satir = (k) => `    U(${JSON.stringify(k.ad)}, ${JSON.stringify(k.il || "—")}, ${JSON.stringify(k.tur)}),`;
  const bolum = [];
  bolum.push("    // ---- Devlet üniversiteleri ----");
  bolum.push(...grup.Devlet.map(satir));
  bolum.push("    // ---- Vakıf üniversiteleri ----");
  bolum.push(...grup["Vakıf"].map(satir));
  if (grup.diger.length) {
    bolum.push("    // ---- Türü belirlenemeyenler (elle düzeltin) ----");
    bolum.push(...grup.diger.map(satir));
  }
  let govde = bolum.join("\n");
  govde = govde.replace(/,$/, ""); // son öğedeki virgülü kaldır
  return "  var UNIVERSITIES = [\n" + govde + "\n  ];";
}

const icerik = await iceriktenListe();
const sonuc = UniParse.parseListe(icerik, Universities.UNIVERSITIES);
if (sonuc.liste.length < 150) {
  console.error("Yalnızca " + sonuc.liste.length + " kurum bulundu; sayfa yapısı değişmiş olabilir. İşlem durduruldu.");
  sonuc.uyarilar.forEach((u) => console.error("  ! " + u));
  process.exit(1);
}
sonuc.uyarilar.forEach((u) => console.warn("  ! " + u));

const eski = new Set(Universities.UNIVERSITIES.map((k) => TP.norm(k.ad)));
const yeniAdlar = new Set(sonuc.liste.map((k) => TP.norm(k.ad)));
const eklenen = sonuc.liste.filter((k) => !eski.has(TP.norm(k.ad)));
const cikan = Universities.UNIVERSITIES.filter((k) => !yeniAdlar.has(TP.norm(k.ad)));
console.log(sonuc.liste.length + " kurum bulundu — " + eklenen.length + " yeni, " + cikan.length + " çıkarılıyor.");
eklenen.forEach((k) => console.log("  + " + k.ad + (k.tur ? " (" + k.tur + ")" : "")));
cikan.forEach((k) => console.log("  - " + k.ad));

if (dryRun) { console.log("(--dry-run: dosya değiştirilmedi)"); process.exit(0); }

const dosya = join(kok, "js", "universities.js");
const kaynak = readFileSync(dosya, "utf8");
const desen = /  var UNIVERSITIES = \[[\s\S]*?\n  \];/;
if (!desen.test(kaynak)) { console.error("universities.js içinde UNIVERSITIES bloğu bulunamadı."); process.exit(1); }
writeFileSync(dosya, kaynak.replace(desen, kodUret(sonuc.liste)), "utf8");
console.log("js/universities.js güncellendi.");
