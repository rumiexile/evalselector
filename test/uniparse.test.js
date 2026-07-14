/*
 * uniparse.test.js — YÖK listesi ayrıştırıcısı birim testleri.
 * Çalıştırma: node test/uniparse.test.js
 */
"use strict";

const UniParse = require("../js/uniparse.js");

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; }
  else { failed++; console.error("BAŞARISIZ: " + name + (extra !== undefined ? " — " + JSON.stringify(extra) : "")); }
}

const mevcut = [
  { ad: "Ankara Üniversitesi", il: "Ankara", tur: "Devlet" },
  { ad: "Koç Üniversitesi", il: "İstanbul", tur: "Vakıf" }
];

// ---- Ad düzeltme (Türkçe başlık yazımı) ----
check("adDuzelt: TAM BÜYÜK → başlık", UniParse.adDuzelt("ANKARA ÜNİVERSİTESİ") === "Ankara Üniversitesi");
check("adDuzelt: İ/ı dönüşümü", UniParse.adDuzelt("İSTANBUL TEKNİK ÜNİVERSİTESİ") === "İstanbul Teknik Üniversitesi");
check("adDuzelt: 've' küçük kalır",
  UniParse.adDuzelt("ANKARA BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ") === "Ankara Bilim ve Teknoloji Üniversitesi");
check("adDuzelt: karışık yazım korunur", UniParse.adDuzelt("Koç Üniversitesi") === "Koç Üniversitesi");

// ---- Sekmeli tablo metni (sayfadan kopyala-yapıştır) ----
const tsv = "Üniversite\tŞehir\tTür\n" +
  "ANKARA ÜNİVERSİTESİ\tANKARA\tDevlet\n" +
  "KOÇ ÜNİVERSİTESİ\tİSTANBUL\tVakıf\n" +
  "YENİ DENEME ÜNİVERSİTESİ\tRİZE\tVAKIF\n" +
  "Toplam: 3 kayıt";
const t1 = UniParse.parseListe(tsv, mevcut);
check("tsv: 3 kurum bulunur (başlık/dipnot atlanır)", t1.liste.length === 3, t1.liste);
check("tsv: bilinen kurumun özenli yazımı devralınır", t1.liste[0].ad === "Ankara Üniversitesi");
check("tsv: şehir ve tür okunur", t1.liste[2].il === "Rize" && t1.liste[2].tur === "Vakıf", t1.liste[2]);

// ---- HTML tablo ----
const html = '<html><body><table>' +
  '<tr><th>Üniversite</th><th>İl</th><th>Türü</th></tr>' +
  '<tr><td><a href="#">ANKARA &Uuml;N&#304;VERS&#304;TES&#304;</a></td><td>ANKARA</td><td>Devlet</td></tr>' +
  '<tr><td><a href="#">ATLAS DENEME ÜNİVERSİTESİ</a></td><td>İZMİR</td><td>Vakıf</td></tr>' +
  '</table><script>var x=1;</script></body></html>';
const t2 = UniParse.parseListe(html, mevcut);
check("html: 2 kurum bulunur", t2.liste.length === 2, t2.liste);
check("html: entity çözümü + eşleşme", t2.liste[0].ad === "Ankara Üniversitesi");
check("html: yeni kurum başlık yazımıyla", t2.liste[1].ad === "Atlas Deneme Üniversitesi" &&
  t2.liste[1].il === "İzmir" && t2.liste[1].tur === "Vakıf", t2.liste[1]);

// ---- Yalnızca ad satırları (tür bilinemez) ----
const duz = "ANKARA ÜNİVERSİTESİ\nBİLİNMEDİK ÜNİVERSİTESİ\n";
const t3 = UniParse.parseListe(duz, mevcut);
check("düz metin: bilinen kurum türünü mevcut listeden alır", t3.liste[0].tur === "Devlet");
check("düz metin: bilinmeyen kurum tursuz kalır ve uyarı üretilir",
  t3.liste[1].tur === null && t3.uyarilar.some(u => u.indexOf("türü") !== -1), t3);

// ---- JSON ----
const json = JSON.stringify([{ ad: "Ankara Üniversitesi", il: "Ankara", tur: "Devlet" },
  { ad: "Örnek Vakıf Üniversitesi", il: "Bursa", tur: "Vakıf" }]);
const t4 = UniParse.parseListe(json, mevcut);
check("json: dizi kabul edilir", t4.liste.length === 2 && t4.liste[1].tur === "Vakıf", t4.liste);

// ---- Tekrarlar ve boş girdi ----
const t5 = UniParse.parseListe("ANKARA ÜNİVERSİTESİ\nAnkara Üniversitesi\n", mevcut);
check("tekrar: normalize ada göre teke iner", t5.liste.length === 1, t5.liste);
check("boş girdi: uyarı döner", UniParse.parseListe("", mevcut).uyarilar.length === 1);

console.log("\nSonuç: " + passed + " başarılı, " + failed + " başarısız.");
process.exit(failed ? 1 : 0);
