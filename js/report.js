/*
 * report.js — Analiz sonuçlarının Excel raporu olarak dışa aktarılması.
 * Tarayıcıda çalışır; küresel XLSX (SheetJS) nesnesini kullanır.
 */
(function (root) {
  "use strict";

  function satirYap(r, criteria) {
    var d = r.data;
    var puanlar = {};
    if (r.scores) {
      Object.keys(criteria.weights).forEach(function (k) {
        puanlar[root.Criteria.CRITERIA_LABELS[k]] =
          r.scores[k] && r.scores[k].uygulanir ? r.scores[k].puan : "—";
      });
    }
    var temel = {
      "Sıra": r.rank,
      "TcNo": d["TcNo"],
      "Ad": d["Ad"],
      "Soyad": d["Soyad"],
      "Üniversite": d["Universite"],
      "Tip": d["Tip"],
      "Akademik Unvan": d["AkademikUnvan"],
      "Akademik Görev": d["Akademik Görev"],
      "İdari Görev": d["IdariGorev"],
      "Temel Alan": d["Temel Alan"],
      "Bilim Alan": d["Bilim Alan"],
      "Seçim (E/Y)": d["Secim"],
      "Toplam Puan": r.total === null ? "—" : r.total,
      "Durum": root.Engine.STATUS_LABELS[r.status],
      "Gerekçe": r.reasons.join(" | "),
      "Notlar / Eksikler": r.notes.concat(
        r.missing.length ? ["Eksik alanlar: " + r.missing.join(", ")] : []
      ).join(" | ")
    };
    Object.keys(puanlar).forEach(function (k) { temel[k] = puanlar[k]; });
    return temel;
  }

  function buildWorkbook(analiz, criteria) {
    var wb = XLSX.utils.book_new();
    var tum = analiz.results.map(function (r) { return satirYap(r, criteria); });

    var ozet = [
      { "Bilgi": "Rapor Tarihi", "Değer": new Date().toLocaleString("tr-TR") },
      { "Bilgi": "Toplam Başvuru", "Değer": analiz.summary.toplam },
      { "Bilgi": "Davet Önerilen", "Değer": analiz.summary.davet },
      { "Bilgi": "Sınırda / İncelemeli", "Değer": analiz.summary.sinirda },
      { "Bilgi": "Uygun Değil", "Değer": analiz.summary["uygun-degil"] },
      { "Bilgi": "Eksik Veri", "Değer": analiz.summary.eksik },
      { "Bilgi": "Mevcut Havuz (E)", "Değer": analiz.summary.havuzE },
      { "Bilgi": "Yeni Başvuru (Y)", "Değer": analiz.summary.yeniY },
      { "Bilgi": "", "Değer": "" },
      { "Bilgi": "Davet Eşik Puanı", "Değer": criteria.davet.esikPuan },
      { "Bilgi": "Sınır Bandı", "Değer": criteria.davet.sinirBandi },
      { "Bilgi": "Kontenjan", "Değer": criteria.davet.kontenjan || "Kapalı" },
      { "Bilgi": "Doktora Şartı", "Değer": criteria.mandatory.doktoraSarti ? "Açık" : "Kapalı" },
      { "Bilgi": "Asgari Unvan Seviyesi", "Değer": criteria.mandatory.minUnvanSeviye },
      { "Bilgi": "Asgari Yabancı Dil Puanı", "Değer": criteria.mandatory.minYabanciDilPuan || "Kapalı" },
      { "Bilgi": "Havuz Bonusu (Secim=E)", "Değer": criteria.secim.havuzBonus },
      { "Bilgi": "Hedef Alanlar", "Değer": (criteria.hedefAlanlar || []).join(", ") || "Seçilmedi" },
      { "Bilgi": "", "Değer": "" },
      { "Bilgi": "Kriter Ağırlıkları", "Değer": Object.keys(criteria.weights).map(function (k) {
          return root.Criteria.CRITERIA_LABELS[k] + ": " + criteria.weights[k];
        }).join(" | ") },
      { "Bilgi": "Not", "Değer": "Bu rapor kural tabanlı otomatik analiz sonucudur; nihai davet kararı yetkili komisyona aittir." }
    ];

    function ekle(ad, veri) {
      var ws = XLSX.utils.json_to_sheet(veri.length ? veri : [{ "Bilgi": "Kayıt yok" }]);
      XLSX.utils.book_append_sheet(wb, ws, ad);
    }

    ekle("Özet", ozet);
    ekle("Davet Önerilenler", tumFiltre(analiz, tum, "davet"));
    ekle("Sınırda", tumFiltre(analiz, tum, "sinirda"));
    ekle("Uygun Olmayanlar", tumFiltre(analiz, tum, "uygun-degil"));
    ekle("Eksik Veri", tumFiltre(analiz, tum, "eksik"));
    ekle("Tüm Sonuçlar", tum);
    return wb;
  }

  function tumFiltre(analiz, tum, durum) {
    return tum.filter(function (_, i) { return analiz.results[i].status === durum; });
  }

  function exportExcel(analiz, criteria) {
    var wb = buildWorkbook(analiz, criteria);
    var tarih = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, "degerlendirici-analiz-raporu-" + tarih + ".xlsx");
  }

  root.Report = { buildWorkbook: buildWorkbook, exportExcel: exportExcel };
})(typeof self !== "undefined" ? self : this);
