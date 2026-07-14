#!/usr/bin/env node
/*
 * update-universities.js — js/universities.js içindeki gömülü kurum listesini
 * YÖK Akademik'in üniversite listesi sayfasından yeniden üretir.
 *
 * Kullanım:
 *   node tools/update-universities.js                # sayfayı indir + dosyayı güncelle
 *   node tools/update-universities.js --in yok.html  # kaydedilmiş sayfadan güncelle
 *   node tools/update-universities.js --dry-run      # yazmadan farkları göster
 *   node tools/update-universities.js --force        # kısa liste uyarısını yok say
 *
 * Not: akademik.yok.gov.tr yurt dışı/veri merkezi IP'lerini engelleyebilir.
 * İndirme başarısız olursa sayfayı tarayıcıda açıp "Sayfayı farklı kaydet"
 * ile .html olarak kaydedin ve --in ile verin. Aynı ayrıştırıcı uygulama
 * arayüzündeki "YÖK listesinden güncelle" penceresinde de kullanılır.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var Universities = require("../js/universities.js");

var HEDEF = path.join(__dirname, "..", "js", "universities.js");
var BASLA = "// >>> KURUM-LISTESI";
var BITIR = "// <<< KURUM-LISTESI";
var MIN_KURUM = 150; // Türkiye'de 200+ üniversite var; altı sayfa yapısı değişti demektir

function arg(ad) {
  var i = process.argv.indexOf(ad);
  return i === -1 ? null : (process.argv[i + 1] || true);
}

function indir(url) {
  var ctl = new AbortController();
  var t = setTimeout(function () { ctl.abort(); }, 30000);
  return fetch(url, {
    signal: ctl.signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/json",
      "Accept-Language": "tr-TR,tr;q=0.9"
    }
  }).then(function (res) {
    clearTimeout(t);
    if (!res.ok) throw new Error("HTTP " + res.status + " " + res.statusText);
    return res.text();
  });
}

function q(s) { return JSON.stringify(String(s)); }

function blokUret(kurumlar, tarih) {
  var gruplar = [
    ["Devlet", "---- Devlet üniversiteleri ----"],
    ["Vakıf", "---- Vakıf üniversiteleri ----"],
    ["Diğer", "---- Tür bilgisi doğrulanamayanlar ----"]
  ];
  var satirlar = [
    "  " + BASLA + " — tools/update-universities.js bu bloğu yeniden üretir.",
    "  // EMBEDDED_GUNCELLEME: listenin YÖK kaynağından üretildiği an (null = elle derlenmiş).",
    "  var EMBEDDED_GUNCELLEME = " + q(tarih) + ";",
    "  var EMBEDDED = ["
  ];
  gruplar.forEach(function (g) {
    var uyeler = kurumlar.filter(function (k) { return (k.tur || "Diğer") === g[0]; })
      .sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); });
    if (!uyeler.length) return;
    satirlar.push("    // " + g[1]);
    uyeler.forEach(function (k) {
      satirlar.push("    U(" + q(k.ad) + ", " + q(k.il) + ", " + q(k.tur) + "),");
    });
  });
  // Son kaydın virgülü kaldırılır
  for (var i = satirlar.length - 1; i >= 0; i--) {
    if (/,$/.test(satirlar[i])) { satirlar[i] = satirlar[i].replace(/,$/, ""); break; }
  }
  satirlar.push("  ];");
  satirlar.push("  " + BITIR);
  return satirlar.join("\n");
}

// Kaynakları sırayla dener (MIS, YÖK Akademik); ilk erişilebilen kullanılır
function kaynaklardanIndir(kaynaklar, i) {
  if (i >= kaynaklar.length) {
    console.error("Hiçbir kaynak indirilemedi. Sayfayı tarayıcıda açıp .html");
    console.error("olarak kaydedin ve şu komutla verin:");
    console.error("  node tools/update-universities.js --in kaydedilen-sayfa.html");
    kaynaklar.forEach(function (k) { console.error("Kaynak: " + k.url); });
    process.exit(2);
  }
  var k = kaynaklar[i];
  return indir(k.url).then(function (icerik) {
    console.log("Kaynak: " + k.ad + " (" + k.url + ")");
    return icerik;
  }, function (e) {
    console.error(k.ad + " indirilemedi: " + e.message);
    return kaynaklardanIndir(kaynaklar, i + 1);
  });
}

function main() {
  var girisDosya = arg("--in");
  var ozelUrl = typeof arg("--url") === "string" ? arg("--url") : null;

  var kaynakP = girisDosya
    ? Promise.resolve(fs.readFileSync(girisDosya, "utf8"))
    : kaynaklardanIndir(ozelUrl ? [{ ad: "--url", url: ozelUrl }] : Universities.KAYNAKLAR, 0);

  kaynakP.then(function (icerik) {
    var sonuc = Universities.parse(icerik);
    var kurumlar = sonuc.kurumlar;

    if (!kurumlar.length) {
      console.error("Hiç kurum bulunamadı; sayfa yapısı değişmiş olabilir.");
      process.exit(1);
    }
    if (kurumlar.length < MIN_KURUM && !arg("--force")) {
      console.error("Yalnızca " + kurumlar.length + " kurum bulundu (beklenen ≥ " + MIN_KURUM + ").");
      console.error("Sayfa yapısı değişmiş olabilir; yine de yazmak için --force kullanın.");
      process.exit(1);
    }

    var fark = Universities.diff(kurumlar);
    console.log("Toplam " + kurumlar.length + " kurum ayrıştırıldı.");
    if (fark.eklenen.length) console.log("Eklenen (" + fark.eklenen.length + "): " + fark.eklenen.join(", "));
    if (fark.cikan.length) console.log("Çıkan (" + fark.cikan.length + "): " + fark.cikan.join(", "));
    if (!fark.eklenen.length && !fark.cikan.length) console.log("Mevcut listeyle ad farkı yok.");
    if (sonuc.eksikBilgi.length) {
      console.log("İl/tür bilgisi doğrulanamayanlar (" + sonuc.eksikBilgi.length + "): " +
        sonuc.eksikBilgi.join(", "));
    }

    if (arg("--dry-run")) { console.log("--dry-run: dosya yazılmadı."); return; }

    var kaynakKod = fs.readFileSync(HEDEF, "utf8");
    var b = kaynakKod.indexOf(BASLA), s = kaynakKod.indexOf(BITIR);
    if (b === -1 || s === -1) {
      console.error("İşaretçiler bulunamadı: " + BASLA + " / " + BITIR);
      process.exit(1);
    }
    var satirBasi = kaynakKod.lastIndexOf("\n", b) + 1;
    var satirSonu = kaynakKod.indexOf("\n", s);
    var yeni = kaynakKod.slice(0, satirBasi) +
      blokUret(kurumlar, new Date().toISOString()) +
      kaynakKod.slice(satirSonu);
    fs.writeFileSync(HEDEF, yeni);
    console.log("js/universities.js güncellendi (" + kurumlar.length + " kurum).");
    console.log("Doğrulama için: node test/universities.test.js");
  }).catch(function (e) {
    console.error("Hata: " + (e && e.message || e));
    process.exit(1);
  });
}

main();
