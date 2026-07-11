/*
 * criteria.js — Öntanımlı kriter seti ve kriter yardımcıları.
 * Tüm puanlar 0-100 aralığında üretilir; kriter ağırlıkları göreli olup
 * kişi bazında uygulanabilir kriterler üzerinden normalize edilir.
 */
(function (root) {
  "use strict";

  var DEFAULT_CRITERIA = {
    // Kriter ağırlıkları (göreli değerler; toplamı 100 olmak zorunda değildir)
    weights: {
      unvan: 20,      // Akademik unvan hiyerarşisi
      gorev: 10,      // Akademik görev (idari personelde idari görev varlığı)
      deneyim: 25,    // TkBsk / AkdGor / IdrGor sayıları
      tecrube: 15,    // Kalite güvencesi deneyimi (metin analizi)
      yabanciDil: 10, // Yabancı dil sınav puanı (100'lük eşdeğer)
      ogrenim: 10,    // Öğrenim düzeyi ve doktora sonrası deneyim yılı
      alan: 10        // Hedef temel alan uygunluğu (hedef alan seçilmemişse devre dışı)
    },
    // Zorunlu (eleyici) koşullar
    mandatory: {
      doktoraSarti: true,   // Akademik personel için doktora / en az Dr. Öğr. Üyesi şartı
      minUnvanSeviye: 3,    // 1=Prof, 2=Doç, 3=Dr. Öğr. Üye, 4=Öğr. Gör., 5=Arş. Gör.
      minYabanciDilPuan: 0, // 0 = koşul kapalı; >0 = 100'lük eşdeğer alt sınır
      idariMuaf: true       // İdari personel unvan/doktora şartından muaf tutulur
    },
    // Mevcut havuz (Secim = "E") için ek puan
    secim: {
      havuzBonus: 0
    },
    // Davet kararı parametreleri
    davet: {
      esikPuan: 60,   // Bu puan ve üzeri: "Davet Önerilir"
      sinirBandi: 5,  // (esik - band) .. esik arası: "Sınırda / İncelemeli"
      kontenjan: 0    // 0 = kapalı; >0 = davet önerisi en fazla N kişiyle sınırlanır
    },
    // Hedef temel alanlar; boş liste = alan kriteri devre dışı
    hedefAlanlar: []
  };

  var CRITERIA_LABELS = {
    unvan: "Akademik Unvan",
    gorev: "Akademik / İdari Görev",
    deneyim: "Değerlendirici Deneyimi (sayısal)",
    tecrube: "Kalite Güvencesi Tecrübesi (metin)",
    yabanciDil: "Yabancı Dil",
    ogrenim: "Öğrenim Durumu",
    alan: "Alan Uygunluğu"
  };

  function cloneCriteria(c) {
    return JSON.parse(JSON.stringify(c || DEFAULT_CRITERIA));
  }

  // Kaydedilmiş/yüklenmiş bir kriter nesnesini öntanımlı iskeletle birleştirir;
  // bilinmeyen alanları atar, eksikleri öntanımlıyla tamamlar.
  function sanitizeCriteria(input) {
    var base = cloneCriteria(DEFAULT_CRITERIA);
    if (!input || typeof input !== "object") return base;
    ["weights", "mandatory", "secim", "davet"].forEach(function (grp) {
      if (input[grp] && typeof input[grp] === "object") {
        Object.keys(base[grp]).forEach(function (k) {
          var v = input[grp][k];
          if (typeof v === "number" && isFinite(v)) base[grp][k] = v;
          if (typeof base[grp][k] === "boolean" && typeof v === "boolean") base[grp][k] = v;
        });
      }
    });
    if (Array.isArray(input.hedefAlanlar)) {
      base.hedefAlanlar = input.hedefAlanlar.filter(function (a) { return typeof a === "string"; });
    }
    return base;
  }

  var api = {
    DEFAULT_CRITERIA: DEFAULT_CRITERIA,
    CRITERIA_LABELS: CRITERIA_LABELS,
    cloneCriteria: cloneCriteria,
    sanitizeCriteria: sanitizeCriteria
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Criteria = api;
})(typeof self !== "undefined" ? self : this);
