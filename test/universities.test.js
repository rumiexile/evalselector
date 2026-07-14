/*
 * universities.test.js — YÖK kurum listesi ayrıştırıcısı birim testleri.
 * Çalıştırma: node test/universities.test.js
 */
"use strict";

const Uni = require("../js/universities.js");

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; }
  else { failed++; console.error("BAŞARISIZ: " + name + (extra !== undefined ? " — " + JSON.stringify(extra) : "")); }
}
function bul(kurumlar, ad) {
  const n = Uni.norm(ad);
  return kurumlar.find((k) => Uni.norm(k.ad) === n) || null;
}

// ---- başlık düzeni (Türkçe) ----
check("titleCase: İ/ı dönüşümü",
  Uni.titleCase("ORTA DOĞU TEKNİK ÜNİVERSİTESİ") === "Orta Doğu Teknik Üniversitesi",
  Uni.titleCase("ORTA DOĞU TEKNİK ÜNİVERSİTESİ"));
check("titleCase: IĞDIR", Uni.titleCase("IĞDIR ÜNİVERSİTESİ") === "Iğdır Üniversitesi",
  Uni.titleCase("IĞDIR ÜNİVERSİTESİ"));
check("titleCase: bağlaç küçük kalır",
  Uni.titleCase("GAZİANTEP İSLAM BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ") ===
    "Gaziantep İslam Bilim ve Teknoloji Üniversitesi");
check("titleCase: kısaltma korunur",
  Uni.titleCase("TOBB EKONOMİ VE TEKNOLOJİ ÜNİVERSİTESİ") === "TOBB Ekonomi ve Teknoloji Üniversitesi",
  Uni.titleCase("TOBB EKONOMİ VE TEKNOLOJİ ÜNİVERSİTESİ"));
check("titleCase: tire sonrası büyür",
  Uni.titleCase("TÜRK-ALMAN ÜNİVERSİTESİ") === "Türk-Alman Üniversitesi",
  Uni.titleCase("TÜRK-ALMAN ÜNİVERSİTESİ"));

// ---- HTML tablo ayrıştırma (ad / il / tür sütunları) ----
const tabloHtml = `
<html><body>
<h1>ÜNİVERSİTELER</h1>
<table id="unvList">
  <tr><th>Üniversite</th><th>İl</th><th>Tür</th></tr>
  <tr><td>1</td><td><a href="x.jsp?u=1">ANKARA ÜNİVERSİTESİ</a></td><td>ANKARA</td><td>DEVLET</td></tr>
  <tr><td>2</td><td><a href="x.jsp?u=2">KOÇ ÜNİVERSİTESİ</a></td><td>İSTANBUL</td><td>VAKIF</td></tr>
  <tr><td>3</td><td>KARAMANOĞLU MEHMETBEY ÜNİVERSİTESİ</td><td>KARAMAN</td><td>DEVLET</td></tr>
  <tr><td>4</td><td>YEPYENİ TEKNOLOJİ ÜNİVERSİTESİ</td><td>KONYA</td><td>VAKIF</td></tr>
  <tr><td>5</td><td>İZMİR YÜKSEK TEKNOLOJİ ENSTİTÜSÜ</td><td>İZMİR</td><td>DEVLET</td></tr>
  <tr><td>6</td><td>ANKARA ÜNİVERSİTESİ</td><td>ANKARA</td><td>DEVLET</td></tr>
</table>
</body></html>`;
{
  const s = Uni.parse(tabloHtml);
  check("tablo: 5 benzersiz kurum", s.kurumlar.length === 5, s.kurumlar.map((k) => k.ad));
  check("tablo: başlık satırı elendi", !bul(s.kurumlar, "Üniversite"));
  const ank = bul(s.kurumlar, "ANKARA ÜNİVERSİTESİ");
  check("tablo: mevcut ad özenli yazımla eşleşti", ank && ank.ad === "Ankara Üniversitesi", ank);
  check("tablo: il/tür sütunları okundu", ank && ank.il === "Ankara" && ank.tur === "Devlet", ank);
  const koc = bul(s.kurumlar, "KOÇ ÜNİVERSİTESİ");
  check("tablo: vakıf türü", koc && koc.tur === "Vakıf", koc);
  const karaman = bul(s.kurumlar, "KARAMANOĞLU MEHMETBEY ÜNİVERSİTESİ");
  check("tablo: 'arama' içeren ad elenmedi", !!karaman, s.kurumlar.map((k) => k.ad));
  const yeni = bul(s.kurumlar, "YEPYENİ TEKNOLOJİ ÜNİVERSİTESİ");
  check("tablo: yeni kurum başlık düzenine çevrildi",
    yeni && yeni.ad === "Yepyeni Teknoloji Üniversitesi", yeni);
  check("tablo: yeni kurumun il/türü sayfadan alındı",
    yeni && yeni.il === "Konya" && yeni.tur === "Vakıf", yeni);
  check("tablo: eksik bilgi yok", s.eksikBilgi.length === 0, s.eksikBilgi);
}

// ---- Bağlantı listesi (tablo yok, tür/il bilgisi yok) ----
const linkHtml = `
<div class="menu"><a href="#">Üniversiteler</a><a href="#">Akademik Arama</a></div>
<div class="list">
  <a href="uni.jsp?id=1">BOĞAZİÇİ ÜNİVERSİTESİ</a>
  <a href="uni.jsp?id=2">HİÇ DUYULMAMIŞ SAĞLIK ÜNİVERSİTESİ</a>
  <a href="uni.jsp?id=3">GEBZE TEKNİK ÜNİVERSİTESİ</a>
  <a href="uni.jsp?id=4">SABANCI ÜNİVERSİTESİ</a>
  <a href="uni.jsp?id=5">HACETTEPE ÜNİVERSİTESİ</a>
  <a href="uni.jsp?id=6">EGE ÜNİVERSİTESİ</a>
</div>`;
{
  const s = Uni.parse(linkHtml);
  check("link: 6 kurum", s.kurumlar.length === 6, s.kurumlar.map((k) => k.ad));
  check("link: menü etiketi elendi", !bul(s.kurumlar, "Üniversiteler"));
  const bogazici = bul(s.kurumlar, "BOĞAZİÇİ ÜNİVERSİTESİ");
  check("link: il/tür gömülü listeden tamamlandı",
    bogazici && bogazici.il === "İstanbul" && bogazici.tur === "Devlet", bogazici);
  const bilinmeyen = bul(s.kurumlar, "HİÇ DUYULMAMIŞ SAĞLIK ÜNİVERSİTESİ");
  check("link: bilinmeyen kurum 'Diğer' olarak işaretlendi",
    bilinmeyen && bilinmeyen.il === "—" && bilinmeyen.tur === "Diğer", bilinmeyen);
  check("link: eksik bilgi raporlandı", s.eksikBilgi.length === 1, s.eksikBilgi);
}

// ---- Düz metin (kopyala-yapıştır) ----
const duzMetin = [
  "ANKARA ÜNİVERSİTESİ\tANKARA\tDEVLET",
  "İHSAN DOĞRAMACI BİLKENT ÜNİVERSİTESİ\tANKARA\tVAKIF",
  "Üniversite Listesi",
  "MARMARA ÜNİVERSİTESİ  İSTANBUL  DEVLET",
  ""
].join("\n");
{
  const s = Uni.parse(duzMetin);
  check("metin: 3 kurum", s.kurumlar.length === 3, s.kurumlar.map((k) => k.ad));
  const marmara = bul(s.kurumlar, "MARMARA ÜNİVERSİTESİ");
  check("metin: çift boşluk ayraç olarak çalıştı",
    marmara && marmara.il === "İstanbul" && marmara.tur === "Devlet", marmara);
}

// ---- HTML varlıkları (entity) ----
{
  const s = Uni.parse('<table><tr><td>&Ccedil;UKUROVA &Uuml;N&#304;VERS&#304;TES&#304;</td>' +
    "<td>ADANA</td><td>DEVLET</td></tr>" +
    "<tr><td>EGE ÜNİVERSİTESİ</td><td>İZMİR</td><td>DEVLET</td></tr>" +
    "<tr><td>GAZİ ÜNİVERSİTESİ</td><td>ANKARA</td><td>DEVLET</td></tr>" +
    "<tr><td>ATATÜRK ÜNİVERSİTESİ</td><td>ERZURUM</td><td>DEVLET</td></tr>" +
    "<tr><td>SELÇUK ÜNİVERSİTESİ</td><td>KONYA</td><td>DEVLET</td></tr></table>");
  const cukurova = bul(s.kurumlar, "ÇUKUROVA ÜNİVERSİTESİ");
  check("entity: Ç/İ çözüldü", cukurova && cukurova.ad === "Çukurova Üniversitesi", s.kurumlar[0]);
}

// ---- setList / diff / reset ----
{
  const eskiSayi = Uni.UNIVERSITIES.length;
  const ref = Uni.UNIVERSITIES; // yerinde güncellenmeli (uygulama referansları için)
  const yeni = [
    { ad: "Ankara Üniversitesi", il: "Ankara", tur: "Devlet" },
    { ad: "Yepyeni Teknoloji Üniversitesi", il: "Konya", tur: "Vakıf" }
  ];
  const fark = Uni.diff(yeni);
  check("diff: eklenen", fark.eklenen.length === 1 && fark.eklenen[0] === "Yepyeni Teknoloji Üniversitesi", fark.eklenen);
  check("diff: çıkan sayısı", fark.cikan.length === eskiSayi - 1, fark.cikan.length);

  Uni.setList(yeni, { kaynak: "yok", guncelleme: "2026-07-14T00:00:00Z" });
  check("setList: yerinde güncelleme", ref === Uni.UNIVERSITIES && ref.length === 2);
  check("setList: meta", Uni.meta().kaynak === "yok" && Uni.meta().guncelleme === "2026-07-14T00:00:00Z");

  Uni.reset();
  check("reset: gömülü listeye dönüş", ref.length === eskiSayi && Uni.meta().kaynak === "gomulu");
}

// ---- Gömülü liste bütünlüğü ----
{
  const adlar = new Set(Uni.EMBEDDED.map((u) => Uni.norm(u.ad)));
  check("gömülü: tekrar yok", adlar.size === Uni.EMBEDDED.length);
  check("gömülü: 150+ kurum", Uni.EMBEDDED.length >= 150, Uni.EMBEDDED.length);
  check("gömülü: alanlar tam", Uni.EMBEDDED.every((u) => u.ad && u.il && u.tur));
}

console.log("universities.test: " + passed + " başarılı, " + failed + " başarısız");
process.exit(failed ? 1 : 0);
