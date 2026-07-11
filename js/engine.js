/*
 * engine.js — Puanlama ve uygunluk motoru.
 * Girdi: satır nesneleri (kanonik sütun adlarıyla) + kriter seti.
 * Çıktı: kişi bazında puan dökümü, durum ve gerekçeler; genel özet.
 *
 * Durumlar:
 *   davet        — zorunlu koşulları sağlar, puanı eşik ve üzerinde (kontenjan içinde)
 *   sinirda      — eşiğin hemen altında (sınır bandı) veya kontenjan dışı kalanlar
 *   uygun-degil  — zorunlu koşulu sağlamaz veya puanı yetersiz
 *   eksik        — zorunlu alanları eksik ya da mükerrer kayıt; puanlanmaz
 */
(function (root) {
  "use strict";

  var TP = (typeof module !== "undefined" && module.exports)
    ? require("./textparse.js")
    : root.TextParse;

  // Beklenen sütunlar (kanonik ad -> zorunlu mu)
  var COLUMNS = [
    { ad: "TcNo", zorunlu: true },
    { ad: "Universite", zorunlu: true },
    { ad: "Tip", zorunlu: true },
    { ad: "Akademik Görev", zorunlu: false },
    { ad: "AkademikUnvan", zorunlu: false },
    { ad: "IdariGorev", zorunlu: false },
    { ad: "Ad", zorunlu: true },
    { ad: "Soyad", zorunlu: true },
    { ad: "Temel Alan", zorunlu: false },
    { ad: "Bilim Alan", zorunlu: false },
    { ad: "TkBsk", zorunlu: false },
    { ad: "AkdGor", zorunlu: false },
    { ad: "IdrGor", zorunlu: false },
    { ad: "Tecrube", zorunlu: false },
    { ad: "YabanciDil", zorunlu: false },
    { ad: "Ogrenim", zorunlu: false },
    { ad: "Secim", zorunlu: false }
  ];

  // Başlık eşleştirme: dosyadaki başlıkları kanonik adlara bağlar.
  // Dönen değer: {mapping: {dosyaBasligi: kanonikAd}, eksik: [...], fazladan: [...]}
  function matchColumns(headers) {
    var canon = {};
    COLUMNS.forEach(function (c) { canon[TP.norm(c.ad)] = c.ad; });
    // yaygın yazım farkları
    var esanlam = {
      "tc no": "TcNo", "tckimlikno": "TcNo", "tc kimlik no": "TcNo",
      "kurum": "Universite", "universite": "Universite",
      "akademik unvan": "AkademikUnvan", "unvan": "AkademikUnvan",
      "akademikgorev": "Akademik Görev", "akademik gorev": "Akademik Görev",
      "idari gorev": "IdariGorev", "idarigorev": "IdariGorev",
      "temelalan": "Temel Alan", "bilimalan": "Bilim Alan",
      "tkbsk": "TkBsk", "akdgor": "AkdGor", "idrgor": "IdrGor",
      "tecrube": "Tecrube", "yabancidil": "YabanciDil",
      "ogrenim": "Ogrenim", "secim": "Secim", "tip": "Tip",
      "ad": "Ad", "soyad": "Soyad", "tcno": "TcNo"
    };
    var mapping = {}, bulunan = {}, fazladan = [];
    (headers || []).forEach(function (h) {
      var n = TP.norm(h);
      var hedef = canon[n] || esanlam[n];
      if (hedef && !bulunan[hedef]) { mapping[h] = hedef; bulunan[hedef] = true; }
      else fazladan.push(h);
    });
    var eksik = COLUMNS.filter(function (c) { return !bulunan[c.ad]; })
                       .map(function (c) { return c.ad; });
    return { mapping: mapping, eksik: eksik, fazladan: fazladan };
  }

  function unvanPuani(seviye) {
    // 1=Prof ... 5=Arş. Gör.
    return { 1: 100, 2: 85, 3: 70, 4: 45, 5: 25 }[seviye] || 0;
  }

  function gorevPuani(sira) {
    // 1. sıra=100, 24. sıra=20; hiyerarşide eşleşmeyen ama bildirilen görev=20
    if (sira === null) return 20;
    return Math.round(100 - ((sira - 1) * 80) / 23);
  }

  function tipIdariMi(tip) {
    return /idari/.test(TP.norm(tip));
  }

  // Tek adayı puanlar. Dönen değer: {scores, total, mandatoryFails, notes, missing}
  function scoreCandidate(row, criteria, simdikiYil) {
    var idari = tipIdariMi(row["Tip"]);
    var scores = {}; // key -> {puan, aciklama, uygulanir}
    var notes = [];

    // --- Unvan ---
    var unvan = TP.parseUnvan(row["AkademikUnvan"]);
    if (idari) {
      scores.unvan = { puan: 0, aciklama: "İdari personel; unvan kriteri uygulanmaz.", uygulanir: false };
    } else if (unvan) {
      scores.unvan = { puan: unvanPuani(unvan.seviye), aciklama: unvan.ad + " (seviye " + unvan.seviye + ")", uygulanir: true };
    } else if (TP.isBlank(row["AkademikUnvan"])) {
      scores.unvan = { puan: 0, aciklama: "Unvan bilgisi boş.", uygulanir: true };
      notes.push("Akademik unvan bilgisi eksik.");
    } else {
      scores.unvan = { puan: 0, aciklama: "Unvan çözümlenemedi: \"" + row["AkademikUnvan"] + "\"", uygulanir: true };
      notes.push("Akademik unvan tanınamadı; kontrol ediniz.");
    }

    // --- Görev ---
    if (idari) {
      var idariVar = !TP.isBlank(row["IdariGorev"]);
      scores.gorev = {
        puan: idariVar ? 60 : 0,
        aciklama: idariVar ? "İdari görev: " + row["IdariGorev"] : "İdari görev bilgisi boş.",
        uygulanir: true
      };
      if (!idariVar) notes.push("İdari görev bilgisi eksik.");
    } else {
      var gorev = TP.parseGorev(row["Akademik Görev"]);
      if (gorev === null) {
        scores.gorev = { puan: 0, aciklama: "Akademik görev bilgisi boş.", uygulanir: true };
      } else {
        scores.gorev = {
          puan: gorevPuani(gorev.sira),
          aciklama: gorev.sira === null
            ? "Görev hiyerarşide eşleşmedi: \"" + row["Akademik Görev"] + "\" (taban puan verildi)"
            : "Hiyerarşi sırası " + gorev.sira + ": " + row["Akademik Görev"],
          uygulanir: true
        };
        if (gorev.sira === null) notes.push("Akademik görev hiyerarşide eşleşmedi; kontrol ediniz.");
      }
    }

    // --- Deneyim (sayısal) ---
    var tk = TP.parseSayi(row["TkBsk"]), ak = TP.parseSayi(row["AkdGor"]), id = TP.parseSayi(row["IdrGor"]);
    var deneyimHam = (tk || 0) * 20 + (ak || 0) * 10 + (id || 0) * 10;
    scores.deneyim = {
      puan: Math.min(100, deneyimHam),
      aciklama: "Takım başkanlığı: " + (tk === null ? "—" : tk) +
                ", akademik değerlendirme: " + (ak === null ? "—" : ak) +
                ", idari değerlendirme: " + (id === null ? "—" : id),
      uygulanir: true
    };
    if (tk === null && ak === null && id === null) notes.push("Değerlendirici deneyim sayıları boş.");

    // --- Tecrübe (metin) ---
    var tec = TP.parseTecrube(row["Tecrube"]);
    if (tec === null) {
      scores.tecrube = { puan: 0, aciklama: "Tecrübe alanı boş.", uygulanir: true };
      notes.push("Kalite güvencesi tecrübe açıklaması eksik.");
    } else {
      scores.tecrube = {
        puan: tec.puan,
        aciklama: tec.bulgular.length ? "Bulgular: " + tec.bulgular.join(", ") : "Tanımlı anahtar ifade bulunamadı.",
        uygulanir: true
      };
      if (!tec.bulgular.length) notes.push("Tecrübe metninde kalite güvencesine dair tanımlı ifade bulunamadı; elle inceleme önerilir.");
    }

    // --- Yabancı dil ---
    var dil = TP.parseYabanciDil(row["YabanciDil"]);
    if (dil === null) {
      scores.yabanciDil = { puan: 0, aciklama: "Yabancı dil bilgisi boş.", uygulanir: true, esdeger: null };
      notes.push("Yabancı dil bilgisi eksik.");
    } else if (dil.puan === null) {
      scores.yabanciDil = { puan: 0, aciklama: "Sınav/puan çözümlenemedi: \"" + row["YabanciDil"] + "\"", uygulanir: true, esdeger: null };
      notes.push("Yabancı dil bilgisi çözümlenemedi; elle inceleme önerilir.");
    } else {
      scores.yabanciDil = {
        puan: dil.puan,
        aciklama: dil.sinav + " " + dil.ham + " (100'lük eşdeğer: " + dil.puan + ")",
        uygulanir: true,
        esdeger: dil.puan
      };
    }

    // --- Öğrenim ---
    var ogr = TP.parseOgrenim(row["Ogrenim"], simdikiYil);
    var doktorali = false;
    if (ogr === null) {
      scores.ogrenim = { puan: 0, aciklama: "Öğrenim bilgisi boş.", uygulanir: true };
      notes.push("Öğrenim bilgisi eksik.");
    } else if (ogr.duzey === "doktora") {
      doktorali = true;
      var yilPuan = 0, yilTxt = "yıl bilgisi yok";
      if (ogr.doktoraYili) {
        var gecen = Math.max(0, simdikiYil - ogr.doktoraYili);
        yilPuan = Math.min(40, gecen * 4);
        yilTxt = ogr.doktoraYili + " (" + gecen + " yıl deneyim)";
      }
      scores.ogrenim = { puan: 60 + yilPuan, aciklama: "Doktora; mezuniyet: " + yilTxt, uygulanir: true };
    } else if (ogr.duzey === "yuksek_lisans") {
      scores.ogrenim = { puan: 30, aciklama: "Yüksek lisans.", uygulanir: true };
    } else if (ogr.duzey === "lisans") {
      scores.ogrenim = { puan: 10, aciklama: "Lisans.", uygulanir: true };
    } else {
      scores.ogrenim = { puan: 0, aciklama: "Öğrenim düzeyi çözümlenemedi.", uygulanir: true };
      notes.push("Öğrenim bilgisi çözümlenemedi; elle inceleme önerilir.");
    }
    // Unvan seviyesi 1-3 doktora karinesidir
    if (!doktorali && unvan && unvan.seviye <= 3) doktorali = true;

    // --- Alan uygunluğu ---
    var hedefler = (criteria.hedefAlanlar || []).map(TP.norm).filter(Boolean);
    if (!hedefler.length) {
      scores.alan = { puan: 0, aciklama: "Hedef alan seçilmedi; kriter devre dışı.", uygulanir: false };
    } else {
      var temel = TP.norm(row["Temel Alan"]);
      var uygun = temel && hedefler.indexOf(temel) !== -1;
      scores.alan = {
        puan: uygun ? 100 : 0,
        aciklama: uygun ? "Temel alan hedef alanlar içinde: " + row["Temel Alan"]
                        : (temel ? "Temel alan hedef alanlar dışında: " + row["Temel Alan"] : "Temel alan bilgisi boş."),
        uygulanir: true
      };
      if (!temel) notes.push("Temel alan bilgisi eksik.");
    }

    // --- Ağırlıklı toplam (kişi bazında uygulanabilir kriterler normalize edilir) ---
    var w = criteria.weights, toplamW = 0, toplam = 0;
    Object.keys(w).forEach(function (k) {
      if (scores[k] && scores[k].uygulanir && w[k] > 0) toplamW += w[k];
    });
    Object.keys(w).forEach(function (k) {
      if (scores[k] && scores[k].uygulanir && w[k] > 0 && toplamW > 0) {
        toplam += scores[k].puan * (w[k] / toplamW);
      }
    });

    // --- Havuz bonusu ---
    var havuzda = TP.norm(row["Secim"]) === "e";
    var bonus = havuzda ? (criteria.secim.havuzBonus || 0) : 0;
    toplam = Math.min(100, toplam + bonus);

    // --- Zorunlu koşullar ---
    var m = criteria.mandatory, fails = [];
    var muaf = idari && m.idariMuaf;
    if (m.doktoraSarti && !muaf && !doktorali) {
      fails.push("Doktora / sanatta yeterlik şartı sağlanmıyor.");
    }
    if (m.minUnvanSeviye >= 1 && m.minUnvanSeviye <= 5 && !muaf) {
      if (!unvan || unvan.seviye > m.minUnvanSeviye) {
        fails.push("Asgari unvan şartı (seviye " + m.minUnvanSeviye + " ve üstü) sağlanmıyor.");
      }
    }
    if (m.minYabanciDilPuan > 0) {
      var esd = scores.yabanciDil.esdeger;
      if (esd === null || esd < m.minYabanciDilPuan) {
        fails.push("Asgari yabancı dil puanı (" + m.minYabanciDilPuan + ") sağlanmıyor.");
      }
    }

    return {
      scores: scores,
      total: Math.round(toplam * 10) / 10,
      bonus: bonus,
      havuzda: havuzda,
      idari: idari,
      mandatoryFails: fails,
      notes: notes
    };
  }

  // Ana analiz. rows: kanonik anahtarlarla satır nesneleri.
  function analyze(rows, criteria, opts) {
    opts = opts || {};
    var simdikiYil = opts.simdikiYil || new Date().getFullYear();
    var results = [];
    var gorulenTc = {};

    rows.forEach(function (row, i) {
      var r = {
        index: i,
        data: row,
        status: null,
        total: null,
        scores: null,
        reasons: [],
        notes: [],
        missing: []
      };

      // Zorunlu alan kontrolü
      COLUMNS.forEach(function (c) {
        if (c.zorunlu && TP.isBlank(row[c.ad])) r.missing.push(c.ad);
      });

      // Mükerrer kayıt kontrolü
      var tc = String(row["TcNo"] === undefined || row["TcNo"] === null ? "" : row["TcNo"]).trim();
      if (tc && gorulenTc[tc] !== undefined) {
        r.status = "eksik";
        r.reasons.push("Mükerrer TcNo: aynı kimlik numarası " + (gorulenTc[tc] + 2) + ". satırda da mevcut.");
        results.push(r);
        return;
      }
      if (tc) gorulenTc[tc] = i;

      if (r.missing.length) {
        r.status = "eksik";
        r.reasons.push("Zorunlu alan(lar) boş: " + r.missing.join(", "));
        results.push(r);
        return;
      }

      var sc = scoreCandidate(row, criteria, simdikiYil);
      r.scores = sc.scores;
      r.total = sc.total;
      r.bonus = sc.bonus;
      r.havuzda = sc.havuzda;
      r.idari = sc.idari;
      r.notes = sc.notes;

      if (sc.mandatoryFails.length) {
        r.status = "uygun-degil";
        r.reasons = sc.mandatoryFails.slice();
      } else {
        var esik = criteria.davet.esikPuan, band = criteria.davet.sinirBandi;
        if (r.total >= esik) {
          r.status = "davet";
          r.reasons.push("Puan (" + r.total + ") eşik değerin (" + esik + ") üzerinde.");
        } else if (r.total >= esik - band) {
          r.status = "sinirda";
          r.reasons.push("Puan (" + r.total + ") eşik değere (" + esik + ") yakın; inceleme önerilir.");
        } else {
          r.status = "uygun-degil";
          r.reasons.push("Puan (" + r.total + ") eşik değerin (" + esik + ") altında.");
        }
      }
      results.push(r);
    });

    // Sıralama: davet > sinirda > uygun-degil > eksik; grup içinde puana göre azalan
    var sira = { davet: 0, sinirda: 1, "uygun-degil": 2, eksik: 3 };
    results.sort(function (a, b) {
      if (sira[a.status] !== sira[b.status]) return sira[a.status] - sira[b.status];
      return (b.total || 0) - (a.total || 0);
    });
    results.forEach(function (r, i) { r.rank = i + 1; });

    // Kontenjan uygulaması
    var kont = criteria.davet.kontenjan;
    if (kont > 0) {
      var davetli = 0;
      results.forEach(function (r) {
        if (r.status === "davet") {
          davetli++;
          if (davetli > kont) {
            r.status = "sinirda";
            r.reasons.push("Kontenjan (" + kont + " kişi) dışında kaldı; yedek olarak değerlendirilebilir.");
          }
        }
      });
    }

    var summary = { toplam: results.length, davet: 0, sinirda: 0, "uygun-degil": 0, eksik: 0, havuzE: 0, yeniY: 0 };
    results.forEach(function (r) {
      summary[r.status]++;
      var s = TP.norm(r.data["Secim"]);
      if (s === "e") summary.havuzE++;
      else if (s === "y") summary.yeniY++;
    });

    return { results: results, summary: summary };
  }

  var STATUS_LABELS = {
    "davet": "Davet Önerilir",
    "sinirda": "Sınırda / İncelemeli",
    "uygun-degil": "Uygun Değil",
    "eksik": "Eksik Veri"
  };

  var api = {
    COLUMNS: COLUMNS,
    STATUS_LABELS: STATUS_LABELS,
    matchColumns: matchColumns,
    scoreCandidate: scoreCandidate,
    analyze: analyze
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Engine = api;
})(typeof self !== "undefined" ? self : this);
