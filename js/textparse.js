/*
 * textparse.js — Serbest metin alanlarının (unvan, görev, yabancı dil,
 * öğrenim, tecrübe) deterministik kurallarla ayrıştırılması.
 * Tüm eşleştirmeler Türkçe karakterlere duyarsız normalize metin üzerinde yapılır.
 */
(function (root) {
  "use strict";

  // Türkçe duyarsız normalizasyon: küçük harf + aksan/nokta sadeleştirme
  function norm(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
      .toLowerCase()
      .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g")
      .replace(/ü/g, "u").replace(/ö/g, "o")
      .replace(/[.\-_/\\]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isBlank(v) {
    return v === null || v === undefined || String(v).trim() === "";
  }

  // ---- Akademik unvan (1 = en üst) -------------------------------------
  // Dönen değer: {seviye: 1..5, ad} veya null (eşleşme yok / boş)
  // Not: "Yrd. Doç." kalıbı "Doç." kuralından önce sınanmalıdır.
  var UNVAN_RULES = [
    { seviye: 1, ad: "Prof.",          re: /\bprof\b|profesor/ },
    { seviye: 3, ad: "Dr. Öğr. Üyesi", re: /dr ogr|ogretim uyesi|yardimci docent|yrd doc|\bdou\b/ },
    { seviye: 2, ad: "Doç.",           re: /\bdoc\b|docent/ },
    { seviye: 4, ad: "Öğr. Gör.",      re: /ogr gor|ogretim gorevlisi|\bokutman\b/ },
    { seviye: 5, ad: "Arş. Gör.",      re: /ars gor|arastirma gorevlisi/ }
  ];

  function parseUnvan(text) {
    var n = norm(text);
    if (!n) return null;
    for (var i = 0; i < UNVAN_RULES.length; i++) {
      if (UNVAN_RULES[i].re.test(n)) return { seviye: UNVAN_RULES[i].seviye, ad: UNVAN_RULES[i].ad };
    }
    return null;
  }

  // ---- Akademik görev hiyerarşisi (1 = en üst, 24 = en alt) ------------
  var GOREV_RULES = [
    { sira: 1,  re: /^rektor\b(?! yard)/ },
    { sira: 2,  re: /rektor yard/ },
    { sira: 3,  re: /genel sekreter/ },
    { sira: 4,  re: /\bdekan\b(?! yard)/ },
    { sira: 5,  re: /dekan yard/ },
    { sira: 6,  re: /fakulte kurulu/ },
    { sira: 7,  re: /enstitu mudur(?!u? yard| yard)(u\b|lugu)?/ },
    { sira: 8,  re: /enstitu mudur.* yard/ },
    { sira: 9,  re: /(myo|yuksekokul) mudur(?!u? yard| yard)/ },
    { sira: 10, re: /(myo|yuksekokul) mudur.* yard/ },
    { sira: 11, re: /bolum baskani\b|bolum baskanligi(?! yard)/ },
    { sira: 12, re: /bolum baskan.* yard/ },
    { sira: 13, re: /anabilim dali baskan/ },
    { sira: 14, re: /anasanat dali baskan/ },
    { sira: 15, re: /bilim dali baskan/ },
    { sira: 16, re: /program baskan/ },
    { sira: 17, re: /arastirma ve uygulama merkezi mudur(?!u? yard| yard)/ },
    { sira: 18, re: /arastirma ve uygulama merkezi mudur.* yard/ },
    { sira: 19, re: /bilimsel arastirma projeleri|bap koordinator/ },
    { sira: 20, re: /bologna koordinator/ },
    { sira: 21, re: /erasmus koordinator/ },
    { sira: 22, re: /farabi koordinator/ },
    { sira: 23, re: /mevlana .*koordinator/ },
    { sira: 24, re: /oyp koordinator/ }
  ];

  function parseGorev(text) {
    var n = norm(text);
    if (!n) return null;
    for (var i = 0; i < GOREV_RULES.length; i++) {
      if (GOREV_RULES[i].re.test(n)) return { sira: GOREV_RULES[i].sira };
    }
    return { sira: null }; // görev bildirilmiş ancak hiyerarşide eşleşmedi
  }

  // ---- Yabancı dil ------------------------------------------------------
  // 100'lük eşdeğer puana çevirir. Dönen değer:
  // {puan, sinav, ham} | {puan:null, taninmayan:true} | null (boş alan)
  var DIL_SINAVLARI = [
    { ad: "e-YDS",  re: /e ?yds/,           max: 100 },
    { ad: "YDS",    re: /\byds\b/,          max: 100 },
    { ad: "YÖKDİL", re: /yokdil/,           max: 100 },
    { ad: "KPDS",   re: /\bkpds\b/,         max: 100 },
    { ad: "ÜDS",    re: /\buds\b/,          max: 100 },
    { ad: "TOEFL",  re: /toefl(?: ibt)?/,   max: 120 },
    { ad: "IELTS",  re: /ielts/,            max: 9 },
    { ad: "PTE",    re: /\bpte\b/,          max: 90 }
  ];

  function parseYabanciDil(text) {
    if (isBlank(text)) return null;
    var n = norm(text);
    var best = null;
    for (var i = 0; i < DIL_SINAVLARI.length; i++) {
      var s = DIL_SINAVLARI[i];
      var re = new RegExp(s.re.source + "[^0-9]{0,25}(\\d{1,3}(?:[.,]\\d{1,2})?)", "g");
      var m;
      while ((m = re.exec(n)) !== null) {
        var ham = parseFloat(m[1].replace(",", "."));
        if (!isFinite(ham) || ham < 0 || ham > s.max) continue;
        var puan = Math.round((ham / s.max) * 1000) / 10;
        if (!best || puan > best.puan) best = { puan: puan, sinav: s.ad, ham: ham };
      }
    }
    if (best) return best;
    return { puan: null, taninmayan: true }; // alan dolu ancak sınav/puan çözümlenemedi
  }

  // ---- Öğrenim ----------------------------------------------------------
  // Dönen değer: {duzey: "doktora"|"yuksek_lisans"|"lisans"|null, doktoraYili}
  function parseOgrenim(text, simdikiYil) {
    if (isBlank(text)) return null;
    var n = norm(text);
    var out = { duzey: null, doktoraYili: null };
    if (/doktora|sanatta yeterli(li)?k|\bdr\b|ph ?d/.test(n)) out.duzey = "doktora";
    else if (/yuksek lisans|tezli|tezsiz|master/.test(n)) out.duzey = "yuksek_lisans";
    else if (/lisans|universite mezun/.test(n)) out.duzey = "lisans";
    if (out.duzey === "doktora") {
      // Önce "doktora <yıl>" biçimi aranır; bulunamazsa "<yıl> ... doktora" denenir.
      var kalips = [
        /(?:doktora|sanatta yeterli(?:li)?k|ph ?d)[^0-9]{0,60}((?:19|20)\d{2})/g,
        /((?:19|20)\d{2})[^0-9]{0,60}(?:doktora|sanatta yeterli(?:li)?k|ph ?d)/g
      ];
      for (var ki = 0; ki < kalips.length && out.doktoraYili === null; ki++) {
        var m, yil = null;
        while ((m = kalips[ki].exec(n)) !== null) {
          var y = parseInt(m[1], 10);
          if (y >= 1950 && y <= simdikiYil && (yil === null || y < yil)) yil = y;
        }
        out.doktoraYili = yil;
      }
    }
    return out;
  }

  // ---- Kalite güvencesi tecrübesi (anahtar kelime çıkarımı) -------------
  var TECRUBE_KELIMELERI = [
    { ad: "YÖKAK süreçleri",            re: /yokak/,                                puan: 25 },
    { ad: "Dış değerlendirme",          re: /dis degerlendir/,                      puan: 25 },
    { ad: "Kurumsal akreditasyon",      re: /kurumsal akredit/,                     puan: 20 },
    { ad: "Takım başkanlığı/üyeliği",   re: /takim (baskan|uye)/,                   puan: 20 },
    { ad: "Program akreditasyonu",      re: /program akredit|mudek|fedek|tepdad|vedek|hepdak|epdad|iaar|abet/, puan: 15 },
    { ad: "Akreditasyon (genel)",       re: /akredit/,                              puan: 10 },
    { ad: "Kalite komisyonu üyeliği",   re: /kalite komisyon|kalite kurul/,         puan: 15 },
    { ad: "KİDR / öz değerlendirme",    re: /kidr|oz ?degerlendirme|ozdegerlendirme/, puan: 15 },
    { ad: "İç değerlendirme / iç tetkik", re: /ic degerlendir|ic tetkik|ic denetim/, puan: 10 },
    { ad: "ISO 9001 vb. yönetim sistemi", re: /iso ?9001|kalite yonetim sistemi|kys\b/, puan: 10 },
    { ad: "Kalite güvencesi (genel)",   re: /kalite guvence/,                       puan: 10 },
    { ad: "Değerlendirici eğitimi",     re: /degerlendirici egitimi/,               puan: 10 },
    { ad: "Bologna/AKTS süreçleri",     re: /bologna|akts|diploma eki/,             puan: 5 }
  ];

  // Dönen değer: {puan: 0-100, bulgular: [ad,...]} | null (boş alan)
  function parseTecrube(text) {
    if (isBlank(text)) return null;
    var n = norm(text);
    var toplam = 0, bulgular = [];
    for (var i = 0; i < TECRUBE_KELIMELERI.length; i++) {
      var k = TECRUBE_KELIMELERI[i];
      if (k.re.test(n)) { toplam += k.puan; bulgular.push(k.ad); }
    }
    return { puan: Math.min(100, toplam), bulgular: bulgular };
  }

  function parseSayi(v) {
    if (isBlank(v)) return null;
    var num = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isFinite(num) && num >= 0 ? num : null;
  }

  // ---- İsimden cinsiyet tahmini (yalnızca kesin cinsiyetli yaygın adlar) ----
  // Dönen değer: "K" (kadın) | "E" (erkek) | "?" (belirsiz). Tahmindir; unisex
  // ve tanınmayan adlar "?" sayılır — resmî gösterge değildir.
  var KADIN = ("Ayşe Fatma Emine Hatice Zeynep Elif Meryem Şeyma Merve Selin Pınar Gülay Nurcan Ceren Aslı " +
    "Büşra Ebru Derya Nesrin Tuğba Yasemin Gamze Esra Melis Dilek Sibel Nilüfer Handan Gizem Sevgi Sevil " +
    "Hülya Şule Aysun Aynur Filiz Gül Gülşah Havva İpek Kübra Leyla Melek Nazlı Özlem Rabia Sena Songül " +
    "Tuba Yeliz Zehra Betül Cansu Damla Duygu Ecem Eda Hande İlknur Rana Sıla Simge Şevval Tülay Yağmur Fadime").split(/\s+/);
  var ERKEK = ("Ahmet Mehmet Mustafa Ali Hüseyin Hasan İbrahim Osman Yusuf Murat Ömer Emre Burak Kemal Serkan " +
    "Okan Hakan Kaan Onur Volkan Cem Barış Furkan Selim Erdem Tolga Uğur Sinan Levent Abdullah Adem Bekir " +
    "Bülent Cihan Ekrem Enes Ercan Erhan Erkan Ertuğrul Fatih Ferhat Gökhan Halil Harun İsmail Kadir Koray " +
    "Metin Nuri Oğuz Orhan Ramazan Recep Süleyman Tarık Taner Turgut Yavuz Zeki Alper Arda Batuhan Berkay " +
    "Bora Doruk Efe Ege Eren Kerem Mert Poyraz Yiğit Serhat Serdar").split(/\s+/);
  var _cinsIndex = null;
  function cinsiyetTahmin(ad) {
    if (!_cinsIndex) {
      _cinsIndex = {};
      KADIN.forEach(function (n) { _cinsIndex[norm(n)] = "K"; });
      ERKEK.forEach(function (n) { _cinsIndex[norm(n)] = "E"; });
    }
    return _cinsIndex[norm(ad).split(" ")[0]] || "?";
  }

  var api = {
    norm: norm,
    isBlank: isBlank,
    parseUnvan: parseUnvan,
    parseGorev: parseGorev,
    parseYabanciDil: parseYabanciDil,
    parseOgrenim: parseOgrenim,
    parseTecrube: parseTecrube,
    parseSayi: parseSayi,
    cinsiyetTahmin: cinsiyetTahmin,
    TECRUBE_KELIMELERI: TECRUBE_KELIMELERI
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TextParse = api;
})(typeof self !== "undefined" ? self : this);
