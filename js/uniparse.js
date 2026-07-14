/*
 * uniparse.js — YÖK üniversite listesi ayrıştırıcısı.
 * Kaynak: https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp
 * Sayfanın kaydedilmiş HTML'i, tablodan kopyalanan metin (sekmeyle ayrılmış)
 * ya da JSON dışa aktarımı ayrıştırılır. Hem tarayıcıda (liste güncelleme
 * penceresi) hem Node aracında (tools/update-universities.mjs) kullanılır.
 */
(function (root) {
  "use strict";

  var TP = (typeof module !== "undefined" && module.exports)
    ? require("./textparse.js")
    : root.TextParse;

  // ---- HTML → satır/hücre metni (DOM gerektirmez; Node'da da çalışır) ----
  var ENTITIES = {
    "amp": "&", "lt": "<", "gt": ">", "quot": "\"", "apos": "'", "nbsp": " ",
    "ccedil": "ç", "Ccedil": "Ç", "ouml": "ö", "Ouml": "Ö",
    "uuml": "ü", "Uuml": "Ü", "#304": "İ", "#305": "ı",
    "#286": "Ğ", "#287": "ğ", "#350": "Ş", "#351": "ş"
  };
  function entityCoz(s) {
    return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, function (m, kod) {
      if (ENTITIES[kod]) return ENTITIES[kod];
      if (kod.charAt(0) === "#") {
        var n = kod.charAt(1) === "x" || kod.charAt(1) === "X"
          ? parseInt(kod.slice(2), 16) : parseInt(kod.slice(1), 10);
        if (!isNaN(n)) return String.fromCharCode(n);
      }
      return m;
    });
  }

  function htmlToText(html) {
    return entityCoz(String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\/(tr|li|p|div|h[1-6])>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(td|th)>/gi, "\t")
      .replace(/<[^>]+>/g, ""))
      .replace(/[  ]+/g, " ");
  }

  // ---- Ad düzeltme: TAMAMEN BÜYÜK adları Türkçe kurallarla başlık yap ----
  var KUCUK_KALIR = { "ve": 1, "ile": 1, "için": 1 };
  function adDuzelt(ad) {
    ad = String(ad).replace(/\s+/g, " ").trim();
    if (/[a-zçğıöşü]/.test(ad)) return ad; // zaten karışık büyük/küçük
    return ad.split(" ").map(function (kelime, i) {
      var kucuk = kelime.toLocaleLowerCase("tr");
      if (i > 0 && KUCUK_KALIR[kucuk]) return kucuk;
      // Rakamla ya da parantezle başlayan parçalar olduğu gibi küçültülür
      var ilkHarf = kucuk.search(/[a-zçğıöşüi]/);
      if (ilkHarf === -1) return kelime;
      return kucuk.slice(0, ilkHarf) +
        kucuk.charAt(ilkHarf).toLocaleUpperCase("tr") + kucuk.slice(ilkHarf + 1);
    }).join(" ");
  }

  // ---- Satır bazlı ayrıştırma ----
  function kurumAdiMi(s) {
    var n = TP.norm(s);
    if (!n || n.length < 8 || n.length > 90) return false;
    if (n.split(" ").length < 2) return false; // gerçek kurum adları en az iki kelime
    // Tablo başlığı benzeri etiketler kurum adı sayılmaz
    if (/^(universite|kurum|yuksekokul|enstitu)(ler)?( (adi|turu|listesi|sayisi))?$/.test(n)) return false;
    return n.indexOf("universite") !== -1 || n.indexOf("enstitu") !== -1 ||
           n.indexOf("yuksekokul") !== -1 || n.indexOf("akademi") !== -1;
  }
  function turBul(hucreler, adIdx) {
    for (var i = 0; i < hucreler.length; i++) {
      if (i === adIdx) continue;
      var n = TP.norm(hucreler[i]);
      if (n === "vakif" || n.indexOf("vakif") === 0) return "Vakıf";
      if (n === "devlet" || n.indexOf("devlet") === 0) return "Devlet";
    }
    return null;
  }
  function sehirBul(hucreler, adIdx) {
    for (var i = 0; i < hucreler.length; i++) {
      if (i === adIdx) continue;
      var s = hucreler[i].trim();
      var n = TP.norm(s);
      if (!s || s.length < 3 || s.length > 25) continue;
      if (n.indexOf("vakif") !== -1 || n.indexOf("devlet") !== -1) continue;
      if (n.indexOf("universite") !== -1 || /\d/.test(s)) continue;
      if (/^[A-ZÇĞİÖŞÜa-zçğıöşü .-]+$/.test(s)) return adDuzelt(s);
    }
    return null;
  }

  // metin: HTML, sekmeli tablo metni ya da JSON.
  // mevcut: eldeki liste ([{ad,il,tur}]) — eşleşen kayıtlardan ad/il/tur devralınır.
  // Dönen değer: { liste: [{ad,il,tur}], uyarilar: [metin] }
  function parseListe(metin, mevcut) {
    metin = String(metin || "").trim();
    var uyarilar = [];
    if (!metin) return { liste: [], uyarilar: ["Girdi boş."] };

    // 1) JSON denemesi
    if (metin.charAt(0) === "[" || metin.charAt(0) === "{") {
      try {
        var j = JSON.parse(metin);
        var dizi = Array.isArray(j) ? j : (Array.isArray(j.kurumlar) ? j.kurumlar : (Array.isArray(j.universiteler) ? j.universiteler : null));
        if (dizi) {
          var jListe = [];
          dizi.forEach(function (k) {
            if (typeof k === "string") { if (kurumAdiMi(k)) jListe.push({ ad: adDuzelt(k), il: null, tur: null }); }
            else if (k && k.ad) jListe.push({ ad: adDuzelt(k.ad), il: k.il || k.sehir || null, tur: k.tur || null });
          });
          return zenginlestir(jListe, mevcut, uyarilar);
        }
        uyarilar.push("JSON içinde kurum dizisi bulunamadı; metin olarak denenecek.");
      } catch (e) { /* JSON değil; metin olarak sürdür */ }
    }

    // 2) HTML ise metne indirgeme
    if (/<(html|table|tr|td|div|a)[\s>]/i.test(metin)) metin = htmlToText(metin);

    // 3) Satır satır tarama
    var liste = [];
    metin.split(/\r?\n/).forEach(function (satir) {
      var hucreler = satir.split(/\t|\||;/).map(function (h) { return h.replace(/\s+/g, " ").trim(); });
      var adIdx = -1;
      for (var i = 0; i < hucreler.length; i++) {
        if (kurumAdiMi(hucreler[i])) { adIdx = i; break; }
      }
      if (adIdx === -1) return;
      liste.push({
        ad: adDuzelt(hucreler[adIdx]),
        il: sehirBul(hucreler, adIdx),
        tur: turBul(hucreler, adIdx)
      });
    });
    return zenginlestir(liste, mevcut, uyarilar);
  }

  // Tekrarları at, mevcut listeyle eşleştirip eksik alanları tamamla.
  function zenginlestir(liste, mevcut, uyarilar) {
    uyarilar = uyarilar || [];
    var mevcutIdx = {};
    (mevcut || []).forEach(function (k) { mevcutIdx[TP.norm(k.ad)] = k; });
    var gorulen = {}, sonuc = [];
    liste.forEach(function (k) {
      var n = TP.norm(k.ad);
      if (!n || gorulen[n]) return;
      gorulen[n] = true;
      var eski = mevcutIdx[n];
      if (eski) {
        // Bilinen kurum: özenli yazımı ve eksik alanları mevcut kayıttan al
        sonuc.push({ ad: eski.ad, il: k.il || eski.il, tur: k.tur || eski.tur, ulke: eski.ulke });
      } else {
        sonuc.push({ ad: k.ad, il: k.il || "—", tur: k.tur });
      }
    });
    var tursuz = sonuc.filter(function (k) { return !k.tur; }).length;
    if (tursuz) uyarilar.push(tursuz + " kurumun türü (Devlet/Vakıf) belirlenemedi; vakıf-idari kuralı bu kurumlarda uygulanmaz.");
    var ilsiz = sonuc.filter(function (k) { return !k.il || k.il === "—"; }).length;
    if (ilsiz) uyarilar.push(ilsiz + " kurumun şehri belirlenemedi.");
    return { liste: sonuc, uyarilar: uyarilar };
  }

  var api = { parseListe: parseListe, htmlToText: htmlToText, adDuzelt: adDuzelt, kurumAdiMi: kurumAdiMi };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UniParse = api;
})(typeof self !== "undefined" ? self : this);
