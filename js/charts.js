/*
 * charts.js — Havuz analitiği (Modül 1). Bağımlılıksız, tarayıcı içi.
 * Grafikler HTML/CSS ile çizilir (çubuklar div genişliği, halkalar
 * conic-gradient); YÖKAK mavi paleti ve token'ları kullanılır, her değer
 * doğrudan etiketlenir (düşük kontrastlı dolgular için erişilebilirlik).
 *
 * Kategorik palet (doğrulandı: en kötü komşu CVD ΔE 33.7):
 *   #006eb7 (mavi) · #c4922f (altın) · #5eb3e4 (açık mavi) · #808a97 (nötr)
 */
(function (root) {
  "use strict";

  var TP = root.TextParse;
  var CAT = ["var(--brand-2)", "var(--accent, #c4922f)", "var(--brand-3, #5eb3e4)", "var(--muted)"];
  var CAT_HEX = ["#006eb7", "#c4922f", "#5eb3e4", "#808a97"];

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function sayi(v) { var n = TP.parseSayi(v); return n === null ? 0 : n; }
  function pct(v, t) { return t ? Math.round((v / t) * 1000) / 10 : 0; }

  // ---- İsimden cinsiyet tahmini (yalnızca kesin cinsiyetli yaygın adlar) ----
  var KADIN = ("Ayşe Fatma Emine Hatice Zeynep Elif Meryem Şeyma Merve Selin Pınar Gülay Nurcan Ceren Aslı " +
    "Büşra Ebru Derya Nesrin Tuğba Yasemin Gamze Esra Melis Dilek Sibel Nilüfer Handan Gizem Sevgi Sevil " +
    "Hülya Şule Aysun Aynur Filiz Gül Gülşah Havva İpek Kübra Leyla Melek Nazlı Özlem Rabia Sena Songül " +
    "Tuba Yeliz Zehra Betül Cansu Damla Duygu Ecem Eda Hande İlknur Rana Sıla Simge Şevval Tülay Yağmur Fadime").split(/\s+/);
  var ERKEK = ("Ahmet Mehmet Mustafa Ali Hüseyin Hasan İbrahim Osman Yusuf Murat Ömer Emre Burak Kemal Serkan " +
    "Okan Hakan Kaan Onur Volkan Cem Barış Furkan Selim Erdem Tolga Uğur Sinan Levent Abdullah Adem Bekir " +
    "Bülent Cihan Ekrem Enes Ercan Erhan Erkan Ertuğrul Fatih Ferhat Gökhan Halil Harun İsmail Kadir Koray " +
    "Metin Nuri Oğuz Orhan Ramazan Recep Süleyman Tarık Taner Turgut Yavuz Zeki Alper Arda Batuhan Berkay " +
    "Bora Doruk Efe Ege Eren Kerem Mert Poyraz Yiğit Serhat Serdar").split(/\s+/);
  var cinsIndex = null;
  function cinsiyet(ad) {
    if (!cinsIndex) {
      cinsIndex = {};
      KADIN.forEach(function (n) { cinsIndex[TP.norm(n)] = "K"; });
      ERKEK.forEach(function (n) { cinsIndex[TP.norm(n)] = "E"; });
    }
    var ilk = TP.norm(ad).split(" ")[0];
    return cinsIndex[ilk] || "?";
  }

  // ---- Sayım yardımcıları ----
  function say(rows, anahtar) {
    var m = {};
    rows.forEach(function (r) { var k = anahtar(r); if (k !== null && k !== undefined && k !== "") m[k] = (m[k] || 0) + 1; });
    return m;
  }
  function sirali(m) {
    return Object.keys(m).map(function (k) { return { label: k, value: m[k] }; })
      .sort(function (a, b) { return b.value - a.value; });
  }

  // ---- Bileşenler ----
  function tile(deger, etiket, alt) {
    return '<div class="an-tile"><div class="an-tile-num">' + esc(deger) + "</div>" +
      '<div class="an-tile-lbl">' + esc(etiket) + "</div>" +
      (alt ? '<div class="an-tile-sub">' + esc(alt) + "</div>" : "") + "</div>";
  }

  function hbars(baslik, items, opts) {
    opts = opts || {};
    var toplam = opts.toplam || items.reduce(function (n, i) { return n + i.value; }, 0);
    var max = items.reduce(function (n, i) { return Math.max(n, i.value); }, 1);
    var govde = items.map(function (it) {
      var p = pct(it.value, toplam);
      return '<div class="hbar-row" title="' + esc(it.label) + ": " + it.value + " (%" + p + ')">' +
        '<span class="hbar-label" title="' + esc(it.label) + '">' + esc(it.label) + "</span>" +
        '<span class="hbar-track"><span class="hbar-fill" style="width:' + pct(it.value, max) + '%"></span></span>' +
        '<span class="hbar-val">' + it.value + "</span></div>";
    }).join("");
    return card(baslik, opts.altbilgi, '<div class="hbars">' + govde + "</div>");
  }

  function vbars(baslik, items) {
    var max = items.reduce(function (n, i) { return Math.max(n, i.value); }, 1);
    var toplam = items.reduce(function (n, i) { return n + i.value; }, 0);
    var govde = items.map(function (it) {
      return '<div class="vbar-col" title="' + esc(it.label) + ": " + it.value + " (%" + pct(it.value, toplam) + ')">' +
        '<span class="vbar-val">' + it.value + "</span>" +
        '<span class="vbar-track"><span class="vbar-fill" style="height:' + Math.max(2, pct(it.value, max)) + '%"></span></span>' +
        '<span class="vbar-cat">' + esc(it.label) + "</span></div>";
    }).join("");
    return card(baslik, null, '<div class="vbars">' + govde + "</div>");
  }

  function donut(baslik, segments, merkezSayi, merkezEtiket) {
    var toplam = segments.reduce(function (n, s) { return n + s.value; }, 0) || 1;
    var acc = 0, stops = [];
    segments.forEach(function (s, i) {
      var a = pct(s.value, toplam), b = acc + a;
      stops.push(s.renk + " " + acc + "% " + b + "%");
      acc = b;
    });
    var legend = segments.map(function (s, i) {
      return '<span class="leg-item"><span class="leg-sw" style="background:' + s.renk + '"></span>' +
        esc(s.label) + " — " + s.value + " (%" + pct(s.value, toplam) + ")</span>";
    }).join("");
    var g = '<div class="donut-wrap"><div class="donut" style="background:conic-gradient(' + stops.join(",") + ')">' +
      '<div class="donut-hole"><span class="donut-big">' + esc(merkezSayi) + "</span>" +
      '<span class="donut-sub">' + esc(merkezEtiket || "") + "</span></div></div>" +
      '<div class="prop-legend">' + legend + "</div></div>";
    return card(baslik, null, g);
  }

  function card(baslik, altbilgi, ic) {
    return '<div class="chart-card"><h3>' + esc(baslik) + "</h3>" + ic +
      (altbilgi ? '<p class="chart-note">' + esc(altbilgi) + "</p>" : "") + "</div>";
  }

  // ---- Ana pano ----
  function renderDashboard(rows) {
    rows = rows || [];
    var toplam = rows.length;
    if (!toplam) return "";

    var tip = { akademik: 0, idari: 0, ogrenci: 0, diger: 0 };
    rows.forEach(function (r) {
      var n = TP.norm(r["Tip"]);
      if (n.indexOf("idari") !== -1) tip.idari++;
      else if (n.indexOf("ogrenci") !== -1) tip.ogrenci++;
      else if (n.indexOf("akademik") !== -1) tip.akademik++;
      else tip.diger++;
    });

    // Doktoralı oranı, ortalama görev, ortalama dil
    var doktora = 0, gorevTop = 0, dilTop = 0, dilAdet = 0;
    rows.forEach(function (r) {
      var u = TP.parseUnvan(r["AkademikUnvan"]);
      if ((u && u.seviye <= 3) || /doktora|sanatta yeterli/.test(TP.norm(r["Ogrenim"]))) doktora++;
      gorevTop += sayi(r["TkBsk"]) + sayi(r["AkdGor"]) + sayi(r["IdrGor"]);
      var d = TP.parseYabanciDil(r["YabanciDil"]);
      if (d && d.puan !== null) { dilTop += d.puan; dilAdet++; }
    });

    // Unvan dağılımı (kanonik)
    var unvanM = say(rows, function (r) { var u = TP.parseUnvan(r["AkademikUnvan"]); return u ? u.ad : null; });
    var unvanSira = ["Prof.", "Doç.", "Dr. Öğr. Üyesi", "Öğr. Gör.", "Arş. Gör."];
    var unvanItems = unvanSira.filter(function (a) { return unvanM[a]; }).map(function (a) { return { label: a, value: unvanM[a] }; });

    // Deneyim (görev) dağılımı
    var kova = { "0": 0, "1–2": 0, "3–5": 0, "6–10": 0, "11+": 0 };
    rows.forEach(function (r) {
      var g = sayi(r["TkBsk"]) + sayi(r["AkdGor"]) + sayi(r["IdrGor"]);
      if (g === 0) kova["0"]++; else if (g <= 2) kova["1–2"]++; else if (g <= 5) kova["3–5"]++;
      else if (g <= 10) kova["6–10"]++; else kova["11+"]++;
    });
    var deneyimItems = Object.keys(kova).map(function (k) { return { label: k, value: kova[k] }; });

    // E/Y
    var eSay = 0, ySay = 0, eyBelirsiz = 0;
    rows.forEach(function (r) { var s = TP.norm(r["Secim"]); if (s === "e") eSay++; else if (s === "y") ySay++; else eyBelirsiz++; });

    // Cinsiyet (tahmini)
    var cins = { K: 0, E: 0, "?": 0 };
    rows.forEach(function (r) { cins[cinsiyet(r["Ad"])]++; });

    var html = "";

    // Özet tümceler
    html += '<div class="an-tiles">' +
      tile(toplam, "Toplam Başvuru") +
      tile(tip.akademik + " / " + tip.idari + " / " + tip.ogrenci, "Akademik / İdari / Öğrenci") +
      tile("%" + pct(doktora, toplam), "Doktoralı oranı") +
      tile((Math.round((gorevTop / toplam) * 10) / 10), "Ortalama görev sayısı") +
      tile(dilAdet ? Math.round(dilTop / dilAdet) : "—", "Ortalama dil puanı", dilAdet + " kişide") +
      "</div>";

    // Grafik ızgarası
    html += '<div class="chart-grid">';
    html += hbars("Temel alana göre dağılım", sirali(say(rows, function (r) { return String(r["Temel Alan"] || "").trim(); })));
    html += hbars("Akademik unvana göre dağılım", unvanItems, { altbilgi: "Yalnızca çözümlenebilen akademik unvanlar" });
    html += hbars("Üniversitelere göre dağılım (ilk 12)", sirali(say(rows, function (r) { return String(r["Universite"] || "").trim(); })).slice(0, 12));
    html += vbars("Değerlendirme tecrübesi (toplam görev)", deneyimItems);
    html += donut("Mevcut havuz / Yeni oranı (E/Y)",
      [{ label: "Mevcut havuz (E)", value: eSay, renk: CAT[0] }, { label: "Yeni (Y)", value: ySay, renk: CAT[1] }]
        .concat(eyBelirsiz ? [{ label: "Belirtilmemiş", value: eyBelirsiz, renk: CAT[3] }] : []),
      toplam, "başvuru");
    html += donut("Tip dağılımı",
      [{ label: "Akademik", value: tip.akademik, renk: CAT[0] }, { label: "İdari", value: tip.idari, renk: CAT[1] },
       { label: "Öğrenci", value: tip.ogrenci, renk: CAT[2] }].concat(tip.diger ? [{ label: "Diğer", value: tip.diger, renk: CAT[3] }] : []),
      toplam, "başvuru");
    html += donut("Cinsiyet dengesi (ada göre tahmini)",
      [{ label: "Kadın", value: cins.K, renk: CAT[0] }, { label: "Erkek", value: cins.E, renk: CAT[1] },
       { label: "Belirsiz", value: cins["?"], renk: CAT[3] }],
      toplam, "başvuru");
    html += "</div>";

    return html;
  }

  root.Charts = { renderDashboard: renderDashboard, CAT_HEX: CAT_HEX };
})(typeof self !== "undefined" ? self : this);
