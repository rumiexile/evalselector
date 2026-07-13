/*
 * app.js — Arayüz katmanı: dosya yükleme, kriter düzenleme, sonuç tablosu,
 * aday detayı ve rapor dışa aktarma. Tüm işlem tarayıcı içinde yapılır.
 */
(function () {
  "use strict";

  var state = {
    rows: null,        // kanonik anahtarlarla satırlar
    colInfo: null,     // matchColumns çıktısı
    dosyaAdi: null,
    criteria: null,
    analiz: null,
    filtre: { durum: "hepsi", secim: "hepsi", arama: "" }
  };

  var LS_KEY = "evalselector.criteria.v1";

  function $(id) { return document.getElementById(id); }

  // Uygulama-içi onay penceresi. window.confirm sandbox iframe'lerde (Artifact)
  // engellendiğinden native confirm yerine bu kullanılır.
  // Dönüş: false (vazgeç) | true (onay) | opts.ekstraDeger (varsa üçüncü buton).
  function uiConfirm(mesaj, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var ov = document.getElementById("confirm-modal");
      if (!ov) {
        ov = document.createElement("div");
        ov.id = "confirm-modal";
        ov.className = "modal";
        ov.innerHTML = '<div class="modal-box confirm-box" role="alertdialog" aria-modal="true">' +
          '<p id="confirm-msg"></p><div class="confirm-actions">' +
          '<button type="button" id="confirm-cancel" class="btn btn-ghost"></button>' +
          '<button type="button" id="confirm-extra" class="btn btn-ghost"></button>' +
          '<button type="button" id="confirm-ok" class="btn"></button></div></div>';
        document.body.appendChild(ov);
      }
      var msg = ov.querySelector("#confirm-msg");
      var ok = ov.querySelector("#confirm-ok");
      var cancel = ov.querySelector("#confirm-cancel");
      var extra = ov.querySelector("#confirm-extra");
      msg.textContent = mesaj;
      ok.textContent = opts.onayEtiket || "Onayla";
      cancel.textContent = opts.vazgecEtiket || "Vazgeç";
      ok.className = "btn " + (opts.tehlike ? "btn-danger" : "btn-primary");
      if (opts.ekstraEtiket) { extra.textContent = opts.ekstraEtiket; extra.hidden = false; }
      else { extra.hidden = true; }
      ov.hidden = false;
      ok.focus();
      function kapat(sonuc) {
        ov.hidden = true;
        ok.removeEventListener("click", onOk);
        cancel.removeEventListener("click", onCancel);
        extra.removeEventListener("click", onExtra);
        ov.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKey, true);
        resolve(sonuc);
      }
      function onOk() { kapat(true); }
      function onCancel() { kapat(false); }
      function onExtra() { kapat(opts.ekstraDeger !== undefined ? opts.ekstraDeger : "extra"); }
      function onBackdrop(e) { if (e.target === ov) kapat(false); }
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); kapat(false); }
        else if (e.key === "Enter") { e.preventDefault(); kapat(true); }
      }
      ok.addEventListener("click", onOk);
      cancel.addEventListener("click", onCancel);
      extra.addEventListener("click", onExtra);
      ov.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKey, true);
    });
  }
  window.uiConfirm = uiConfirm;

  // Sandbox-dostu indirme. Artifact gibi sandbox iframe'lerde indirme
  // özniteliği (a.download) engellendiğinden, iframe içindeyken blob yeni
  // sekmede açılır (indirme oradan gerçekleşir). Doğrudan açıldığında
  // (kendi sunucu/masaüstü) normal indirme kullanılır.
  function uiDownload(data, filename) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: "application/octet-stream" });
    var url = URL.createObjectURL(blob);
    var temizle = function () { setTimeout(function () { URL.revokeObjectURL(url); }, 120000); };
    var iframede;
    try { iframede = window.self !== window.top; } catch (e) { iframede = true; }

    if (!iframede) {
      var a = document.createElement("a");
      a.href = url; a.download = filename; a.style.display = "none";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      temizle();
      return true;
    }
    var w = window.open(url, "_blank");
    if (w) { temizle(); return true; }
    // Popup da engellendiyse: kullanıcıya elle indirme bağlantısı göster
    downloadFallback(url, filename);
    temizle();
    return false;
  }
  window.uiDownload = uiDownload;

  function downloadFallback(url, filename) {
    var ov = document.createElement("div");
    ov.className = "modal";
    ov.innerHTML = '<div class="modal-box confirm-box" role="dialog" aria-modal="true">' +
      '<p>Önizleme ortamı otomatik indirmeyi kısıtlıyor. Dosyayı indirmek için bağlantıya tıklayın:</p>' +
      '<div class="confirm-actions">' +
      '<a class="btn btn-primary" href="' + url + '" download="' + esc(filename) + '" target="_blank" rel="noopener">' + esc(filename) + '</a>' +
      '<button type="button" class="btn btn-ghost">Kapat</button></div></div>';
    document.body.appendChild(ov);
    function kapat() { if (ov.parentNode) document.body.removeChild(ov); }
    ov.querySelector("button").addEventListener("click", kapat);
    ov.querySelector("a").addEventListener("click", function () { setTimeout(kapat, 600); });
    ov.addEventListener("click", function (e) { if (e.target === ov) kapat(); });
  }

  // Bir SheetJS çalışma kitabını sandbox-dostu indirir.
  function indirWorkbook(wb, filename) {
    var out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    uiDownload(new Blob([out], { type: "application/octet-stream" }), filename);
  }
  window.indirWorkbook = indirWorkbook;

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function maskTc(tc) {
    var s = String(tc || "").trim();
    if (s.length < 6) return s;
    return s.slice(0, 3) + "*".repeat(s.length - 5) + s.slice(-2);
  }

  // ---------------- Kriterler ----------------

  function loadCriteria() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) return Criteria.sanitizeCriteria(JSON.parse(raw));
    } catch (e) { /* bozuk kayıt yok sayılır */ }
    return Criteria.cloneCriteria(Criteria.DEFAULT_CRITERIA);
  }

  function saveCriteria() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state.criteria)); } catch (e) { /* yoksay */ }
  }

  function renderCriteria() {
    var c = state.criteria;

    var wDiv = $("weights");
    wDiv.innerHTML = "";
    Object.keys(c.weights).forEach(function (k) {
      var disabled = k === "alan" && !(c.hedefAlanlar || []).length;
      var row = document.createElement("div");
      row.className = "w-row" + (disabled ? " w-disabled" : "");
      row.innerHTML =
        '<label for="w-' + k + '">' + esc(Criteria.CRITERIA_LABELS[k]) +
        (disabled ? ' <span class="hint">(hedef alan seçilmedi; devre dışı)</span>' : "") + "</label>" +
        '<input type="number" id="w-' + k + '" min="0" max="100" step="1" value="' + c.weights[k] + '">';
      wDiv.appendChild(row);
      row.querySelector("input").addEventListener("change", function (e) {
        var v = parseFloat(e.target.value);
        c.weights[k] = isFinite(v) && v >= 0 ? v : 0;
        e.target.value = c.weights[k];
        criteriaChanged();
      });
    });

    $("m-doktora").checked = c.mandatory.doktoraSarti;
    $("m-unvan").value = String(c.mandatory.minUnvanSeviye);
    $("m-dil").value = c.mandatory.minYabanciDilPuan;
    $("m-idari-muaf").checked = c.mandatory.idariMuaf;
    $("d-esik").value = c.davet.esikPuan;
    $("d-band").value = c.davet.sinirBandi;
    $("d-kontenjan").value = c.davet.kontenjan;
    $("s-bonus").value = c.secim.havuzBonus;

    renderHedefAlanlar();
  }

  function renderHedefAlanlar() {
    var div = $("hedef-alanlar");
    div.innerHTML = "";
    if (!state.rows) {
      div.innerHTML = '<p class="hint">Alan listesi, dosya yüklendikten sonra dosyadaki "Temel Alan" değerlerinden oluşturulur.</p>';
      return;
    }
    var alanlar = {};
    state.rows.forEach(function (r) {
      var a = String(r["Temel Alan"] || "").trim();
      if (a) alanlar[a] = true;
    });
    var liste = Object.keys(alanlar).sort(function (a, b) { return a.localeCompare(b, "tr"); });
    if (!liste.length) {
      div.innerHTML = '<p class="hint">Dosyada "Temel Alan" değeri bulunamadı.</p>';
      return;
    }
    var secili = {};
    (state.criteria.hedefAlanlar || []).forEach(function (a) { secili[TextParse.norm(a)] = true; });
    liste.forEach(function (alan) {
      var lbl = document.createElement("label");
      lbl.className = "chk";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!secili[TextParse.norm(alan)];
      cb.addEventListener("change", function () {
        var set = state.criteria.hedefAlanlar || [];
        if (cb.checked) set.push(alan);
        else set = set.filter(function (a) { return TextParse.norm(a) !== TextParse.norm(alan); });
        state.criteria.hedefAlanlar = set;
        renderCriteria();
        criteriaChanged();
      });
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(" " + alan));
      div.appendChild(lbl);
    });
  }

  function bindCriteriaControls() {
    function num(id, fn) {
      $(id).addEventListener("change", function (e) {
        var v = parseFloat(e.target.value);
        fn(isFinite(v) && v >= 0 ? v : 0);
        criteriaChanged();
      });
    }
    $("m-doktora").addEventListener("change", function (e) { state.criteria.mandatory.doktoraSarti = e.target.checked; criteriaChanged(); });
    $("m-idari-muaf").addEventListener("change", function (e) { state.criteria.mandatory.idariMuaf = e.target.checked; criteriaChanged(); });
    $("m-unvan").addEventListener("change", function (e) { state.criteria.mandatory.minUnvanSeviye = parseInt(e.target.value, 10); criteriaChanged(); });
    num("m-dil", function (v) { state.criteria.mandatory.minYabanciDilPuan = v; });
    num("d-esik", function (v) { state.criteria.davet.esikPuan = v; });
    num("d-band", function (v) { state.criteria.davet.sinirBandi = v; });
    num("d-kontenjan", function (v) { state.criteria.davet.kontenjan = Math.round(v); });
    num("s-bonus", function (v) { state.criteria.secim.havuzBonus = v; });

    $("btn-reset-criteria").addEventListener("click", function () {
      uiConfirm("Tüm kriterler öntanımlı değerlere döndürülecek. Onaylıyor musunuz?",
        { onayEtiket: "Sıfırla" }).then(function (ok) {
        if (!ok) return;
        state.criteria = Criteria.cloneCriteria(Criteria.DEFAULT_CRITERIA);
        renderCriteria();
        criteriaChanged();
      });
    });

    $("btn-export-criteria").addEventListener("click", function () {
      uiDownload(new Blob([JSON.stringify(state.criteria, null, 2)], { type: "application/octet-stream" }), "kriter-seti.json");
    });

    $("criteria-file").addEventListener("change", function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          state.criteria = Criteria.sanitizeCriteria(JSON.parse(fr.result));
          renderCriteria();
          criteriaChanged();
          bildir("Kriter seti dosyadan yüklendi.", "ok");
        } catch (err) {
          bildir("Kriter dosyası okunamadı: geçerli bir JSON değil.", "err");
        }
      };
      fr.readAsText(f);
      e.target.value = "";
    });
  }

  function criteriaChanged() {
    saveCriteria();
    if (state.rows) runAnalysis();
  }

  // ---------------- Dosya yükleme ----------------

  function bindUpload() {
    var drop = $("dropzone");
    var input = $("file-input");

    drop.addEventListener("click", function () { input.click(); });
    drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("drag"); });
    drop.addEventListener("dragleave", function () { drop.classList.remove("drag"); });
    drop.addEventListener("drop", function (e) {
      e.preventDefault();
      drop.classList.remove("drag");
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener("change", function (e) {
      if (e.target.files.length) handleFile(e.target.files[0]);
      e.target.value = "";
    });

    $("btn-sample").addEventListener("click", loadSampleData);
    $("btn-template").addEventListener("click", downloadTemplate);
  }

  // Boş (yalnızca başlık satırlı) başvuru şablonu + sütun açıklamaları indirir.
  function downloadTemplate() {
    var headers = Engine.COLUMNS.map(function (c) { return c.ad; });
    var wb = XLSX.utils.book_new();

    // 1) Boş şablon sayfası — sadece başlık satırı
    var ws = XLSX.utils.aoa_to_sheet([headers]);
    ws["!cols"] = headers.map(function (h) { return { wch: Math.max(10, h.length + 2) }; });
    XLSX.utils.book_append_sheet(wb, ws, "Başvurular");

    // 2) Açıklama sayfası — her sütunun anlamı ve örnek değeri
    var aciklamalar = [
      ["TcNo", "T.C. Kimlik No — her başvuru için benzersiz kimlik (zorunlu)", "12345678901"],
      ["Universite", "Çalıştığı / bağlı olduğu kurum (zorunlu)", "Ankara Üniversitesi"],
      ["Tip", "Değerlendirici tipi: Akademik / İdari / Öğrenci (zorunlu)", "Akademik"],
      ["Akademik Görev", "Akademik idari görev (Rektör Yrd., Dekan, Bölüm Başkanı vb.)", "Dekan"],
      ["AkademikUnvan", "Prof. Dr. / Doç. Dr. / Dr. Öğr. Üyesi / Öğr. Gör. / Arş. Gör.", "Prof. Dr."],
      ["IdariGorev", "İdari personel için görev unvanı", "Daire Başkanı"],
      ["Ad", "Ad (zorunlu)", "Ayşe"],
      ["Soyad", "Soyad (zorunlu)", "Yılmaz"],
      ["Temel Alan", "YÖKAK temel alanı", "Fen Bilimleri ve Matematik"],
      ["Bilim Alan", "Bilim/alt alan", "Kimya"],
      ["TkBsk", "Takım başkanlığı sayısı (sayı)", "3"],
      ["AkdGor", "Akademik değerlendirici görev sayısı (sayı)", "5"],
      ["IdrGor", "İdari değerlendirici görev sayısı (sayı)", "1"],
      ["Tecrube", "Kalite güvencesi deneyimi (serbest metin)", "YÖKAK dış değerlendirme, kurumsal akreditasyon"],
      ["YabanciDil", "Yabancı dil sınavı ve puanı", "YDS 85"],
      ["Ogrenim", "Öğrenim bilgisi: lisans / yüksek lisans / doktora yılı", "Lisans 1990, Doktora 1998"],
      ["Secim", "Başvuru durumu: E = mevcut havuz, Y = yeni başvuru", "E"]
    ].map(function (r) { return { "Sütun": r[0], "Açıklama": r[1], "Örnek Değer": r[2] }; });
    var ws2 = XLSX.utils.json_to_sheet(aciklamalar, { header: ["Sütun", "Açıklama", "Örnek Değer"] });
    ws2["!cols"] = [{ wch: 16 }, { wch: 62 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Açıklama");

    indirWorkbook(wb, "degerlendirici-basvuru-sablonu.xlsx");
    bildir("Boş başvuru şablonu indirildi (başlık satırı + Açıklama sayfası).", "ok");
  }

  function handleFile(file) {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      bildir("Desteklenmeyen dosya türü. Lütfen .xlsx, .xls veya .csv dosyası yükleyiniz.", "err");
      return;
    }
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var wb = XLSX.read(fr.result, { type: "array" });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
        if (!aoa.length) { bildir("Dosya boş görünüyor.", "err"); return; }
        ingest(aoa, file.name);
      } catch (err) {
        bildir("Dosya okunamadı: " + err.message, "err");
      }
    };
    fr.readAsArrayBuffer(file);
  }

  function ingest(aoa, dosyaAdi) {
    var headers = (aoa[0] || []).map(function (h) { return h === null ? "" : String(h); });
    var info = Engine.matchColumns(headers);
    var rows = [];
    for (var i = 1; i < aoa.length; i++) {
      var satir = aoa[i];
      if (!satir || satir.every(function (v) { return v === null || String(v).trim() === ""; })) continue;
      var obj = {};
      headers.forEach(function (h, j) {
        var canon = info.mapping[h];
        if (canon) obj[canon] = satir[j] === undefined ? null : satir[j];
      });
      rows.push(obj);
    }
    state.rows = rows;
    state.colInfo = info;
    state.dosyaAdi = dosyaAdi;
    renderColumnReport();
    renderHedefAlanlar();
    document.dispatchEvent(new CustomEvent("pool-updated"));
    if (info.eksik.indexOf("TcNo") !== -1 || info.eksik.indexOf("Ad") !== -1 ||
        info.eksik.indexOf("Soyad") !== -1 || info.eksik.indexOf("Tip") !== -1) {
      bildir("Zorunlu sütunlar eksik olduğu için analiz yapılamıyor. Lütfen dosya yapısını kontrol ediniz.", "err");
      state.analiz = null;
      $("results-section").hidden = true;
      return;
    }
    runAnalysis();
  }

  function renderColumnReport() {
    var info = state.colInfo;
    var div = $("column-report");
    var html = '<p><strong>' + esc(state.dosyaAdi) + '</strong> — ' + state.rows.length + " kayıt okundu.</p>";
    if (info.eksik.length) {
      html += '<p class="warn">Dosyada bulunamayan sütunlar: <strong>' + info.eksik.map(esc).join(", ") +
              "</strong>. Bu alanlara bağlı kriterler eksik veri olarak değerlendirilir.</p>";
    }
    if (info.fazladan.length) {
      html += '<p class="hint">Tanınmayan / yok sayılan sütunlar: ' + info.fazladan.map(esc).join(", ") + "</p>";
    }
    if (!info.eksik.length && !info.fazladan.length) {
      html += '<p class="ok">Sütun yapısı beklenen şablonla tam uyumlu.</p>';
    }
    div.innerHTML = html;
    div.hidden = false;
  }

  // ---------------- Analiz ve sonuçlar ----------------

  function runAnalysis() {
    state.analiz = Engine.analyze(state.rows, state.criteria);
    // TcNo -> kriter puanı (takım modülünde üye rozetinde gösterilir)
    state.scoreByTc = {};
    state.analiz.results.forEach(function (r) {
      var tc = String(r.data["TcNo"] === null || r.data["TcNo"] === undefined ? "" : r.data["TcNo"]).trim();
      if (tc && r.total !== null) state.scoreByTc[tc] = r.total;
    });
    renderSummary();
    renderTable();
    $("results-section").hidden = false;
    renderAnalytics();
  }

  function renderAnalytics() {
    if (!window.Charts || !state.rows) return;
    $("analytics-body").innerHTML = Charts.renderDashboard(state.rows);
    $("analytics-section").hidden = false;
  }

  function renderSummary() {
    var s = state.analiz.summary;
    var kart = function (etiket, deger, cls) {
      return '<div class="card ' + cls + '"><div class="card-num">' + deger + '</div><div class="card-lbl">' + etiket + "</div></div>";
    };
    $("summary-cards").innerHTML =
      kart("Toplam Başvuru", s.toplam, "c-toplam") +
      kart("Davet Önerilir", s.davet, "c-davet") +
      kart("Sınırda / İncelemeli", s.sinirda, "c-sinirda") +
      kart("Uygun Değil", s["uygun-degil"], "c-uygun-degil") +
      kart("Eksik Veri", s.eksik, "c-eksik") +
      kart("Havuz (E) / Yeni (Y)", s.havuzE + " / " + s.yeniY, "c-secim");
  }

  function filtreliSonuclar() {
    var f = state.filtre;
    var arama = TextParse.norm(f.arama);
    return state.analiz.results.filter(function (r) {
      if (f.durum !== "hepsi" && r.status !== f.durum) return false;
      if (f.secim !== "hepsi" && TextParse.norm(r.data["Secim"]) !== f.secim) return false;
      if (arama) {
        var hedef = TextParse.norm(
          [r.data["Ad"], r.data["Soyad"], r.data["Universite"], r.data["Temel Alan"], r.data["Bilim Alan"]].join(" ")
        );
        if (hedef.indexOf(arama) === -1) return false;
      }
      return true;
    });
  }

  function renderTable() {
    var liste = filtreliSonuclar();
    var tbody = $("results-body");
    tbody.innerHTML = "";
    $("table-count").textContent = liste.length + " kayıt gösteriliyor";
    liste.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.className = "st-" + r.status;
      tr.innerHTML =
        "<td>" + (r.rank || "—") + "</td>" +
        "<td>" + esc(maskTc(r.data["TcNo"])) + "</td>" +
        "<td>" + esc((r.data["Ad"] || "") + " " + (r.data["Soyad"] || "")) + "</td>" +
        "<td>" + esc(r.data["Universite"]) + "</td>" +
        "<td>" + esc(r.data["AkademikUnvan"] || (r.idari ? "İdari" : "")) + "</td>" +
        "<td>" + esc(r.data["Temel Alan"]) + "</td>" +
        "<td>" + esc(r.data["Secim"]) + "</td>" +
        '<td class="num">' + (r.total === null ? "—" : r.total) + "</td>" +
        '<td><span class="badge b-' + r.status + '">' + Engine.STATUS_LABELS[r.status] + "</span></td>" +
        '<td><button class="btn-mini" type="button">Detay</button></td>';
      tr.querySelector("button").addEventListener("click", function () { showDetail(r); });
      tbody.appendChild(tr);
    });
  }

  function showDetail(r) {
    var c = state.criteria;
    var html = "<h3>" + esc((r.data["Ad"] || "") + " " + (r.data["Soyad"] || "")) + "</h3>" +
      '<p class="hint">' + esc(r.data["Universite"] || "") + " — " + esc(r.data["Tip"] || "") +
      (r.havuzda ? " — Mevcut havuz (E)" : "") + "</p>" +
      '<p><span class="badge b-' + r.status + '">' + Engine.STATUS_LABELS[r.status] + "</span>" +
      (r.total !== null ? ' <strong class="detay-puan">Toplam: ' + r.total + "</strong>" : "") + "</p>";

    html += "<h4>Gerekçe</h4><ul>" + r.reasons.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";

    if (r.scores) {
      html += "<h4>Puan Dökümü</h4><table class='detay-tablo'><thead><tr><th>Kriter</th><th>Ağırlık</th><th>Puan</th><th>Açıklama</th></tr></thead><tbody>";
      Object.keys(c.weights).forEach(function (k) {
        var s = r.scores[k];
        if (!s) return;
        html += "<tr" + (s.uygulanir ? "" : " class='w-disabled'") + "><td>" + esc(Criteria.CRITERIA_LABELS[k]) + "</td><td class='num'>" +
                (s.uygulanir ? c.weights[k] : "—") + "</td><td class='num'>" +
                (s.uygulanir ? s.puan : "—") + "</td><td>" + esc(s.aciklama) + "</td></tr>";
      });
      if (r.bonus) {
        html += "<tr><td>Havuz Bonusu (Secim=E)</td><td class='num'>—</td><td class='num'>+" + r.bonus + "</td><td>Mevcut havuzda bulunan başvuru.</td></tr>";
      }
      html += "</tbody></table>";
    }

    if (r.notes.length) {
      html += "<h4>Notlar</h4><ul>" + r.notes.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    }

    html += "<h4>Ham Veri</h4><table class='detay-tablo'><tbody>";
    Engine.COLUMNS.forEach(function (col) {
      var v = r.data[col.ad];
      if (col.ad === "TcNo") v = maskTc(v);
      html += "<tr><th>" + esc(col.ad) + "</th><td>" + esc(v === null || v === undefined ? "—" : v) + "</td></tr>";
    });
    html += "</tbody></table>";

    $("modal-body").innerHTML = html;
    $("modal").hidden = false;
  }

  // ---------------- Örnek veri ----------------

  function loadSampleData() {
    var H = ["TcNo","Universite","Tip","Akademik Görev","AkademikUnvan","IdariGorev","Ad","Soyad",
             "Temel Alan","Bilim Alan","TkBsk","AkdGor","IdrGor","Tecrube","YabanciDil","Ogrenim","Secim"];
    var D = [
      ["11111111111","Ankara Üniversitesi","Akademik","Dekan","Prof. Dr.","","Ayşe","Yılmaz","Fen Bilimleri ve Matematik","Kimya",3,5,1,"YÖKAK dış değerlendirme takım başkanlığı, kurumsal akreditasyon süreçleri, kalite komisyonu üyeliği","YDS 92,5","Lisans 1988, Doktora 1996","E"],
      ["22222222222","Ege Üniversitesi","Akademik","Bölüm Başkanı","Doç. Dr.","","Mehmet","Kaya","Mühendislik","Bilgisayar Mühendisliği",1,3,0,"MÜDEK program akreditasyonu değerlendiriciliği, iç tetkik","YÖKDİL 81","Doktora 2010","E"],
      ["33333333333","Gazi Üniversitesi","Akademik","Anabilim Dalı Başkanı","Dr. Öğr. Üyesi","","Zeynep","Demir","Sağlık Bilimleri","Hemşirelik",0,1,0,"Kalite komisyonu üyeliği, KİDR hazırlama","YDS 71,25","Doktora 2018","Y"],
      ["44444444444","Atatürk Üniversitesi","Akademik","","Öğr. Gör.","","Ali","Çelik","Sosyal, Beşeri ve İdari Bilimler","İşletme",0,0,0,"","TOEFL iBT 84","Yüksek Lisans 2015","Y"],
      ["55555555555","ODTÜ","İdari","","","Strateji Geliştirme Daire Başkanı","Fatma","Şahin","","",0,0,4,"ISO 9001 kalite yönetim sistemi iç denetçiliği, YÖKAK idari değerlendirici","","Lisans 2001","E"],
      ["66666666666","Hacettepe Üniversitesi","Akademik","Rektör Yardımcısı","Prof. Dr.","","Mustafa","Aydın","Sağlık Bilimleri","Tıp",5,8,2,"YÖKAK takım başkanı, kurumsal akreditasyon, TEPDAD değerlendiricisi, değerlendirici eğitimi eğitmeni","KPDS 95","Doktora 1992","E"],
      ["77777777777","Selçuk Üniversitesi","Akademik","Bologna Koordinatörü","Dr. Öğr. Üyesi","","Elif","Arslan","Eğitim Bilimleri","Eğitim Yönetimi",0,0,0,"Bologna ve AKTS süreçleri, öz değerlendirme raporu","YDS 66","Doktora 2020","Y"],
      ["88888888888","Karadeniz Teknik Üniversitesi","Akademik","","Arş. Gör.","","Emre","Koç","Mühendislik","İnşaat Mühendisliği",0,0,0,"","YDS 78","Lisans 2019, Yüksek Lisans 2021","Y"],
      ["99999999999","Dokuz Eylül Üniversitesi","Akademik","Enstitü Müdürü","Doç. Dr.","","Selin","Öztürk","Fen Bilimleri ve Matematik","Biyoloji",0,2,0,"Program değerlendirme komisyonu, kalite güvencesi çalışmaları","IELTS 7,5","Doktora 2012","Y"],
      ["10101010101","Marmara Üniversitesi","Akademik","Dekan Yardımcısı","Prof. Dr.","","Hasan","Güneş","Sosyal, Beşeri ve İdari Bilimler","İktisat",2,4,0,"Dış değerlendirme, KİDR, kalite komisyonu","ÜDS 88","Doktora 2004","E"],
      ["11111111111","Ankara Üniversitesi","Akademik","Dekan","Prof. Dr.","","Ayşe","Yılmaz","Fen Bilimleri ve Matematik","Kimya",3,5,1,"Mükerrer kayıt örneği","YDS 92,5","Doktora 1996","E"],
      ["12121212121","Akdeniz Üniversitesi","Akademik","Bölüm Başkan Yardımcısı","","","Deniz","","Mimarlık, Planlama ve Tasarım","Mimarlık",0,1,0,"Akreditasyon çalışmaları","YDS 74","Doktora 2016","Y"],
      ["13131313131","Fırat Üniversitesi","Akademik","Dekan","Prof. Dr.","","Kemal","Yıldırım","Mühendislik","Elektrik-Elektronik Mühendisliği",4,6,0,"YÖKAK takım başkanlığı, kurumsal akreditasyon, MÜDEK değerlendiriciliği","YDS 89","Doktora 1998","E"],
      ["14141414141","Erciyes Üniversitesi","Akademik","Enstitü Müdürü","Prof. Dr.","","Nurcan","Aksoy","Sağlık Bilimleri","Eczacılık",2,5,0,"Dış değerlendirme, kalite komisyonu başkanlığı, KİDR","YÖKDİL 86","Doktora 2001","E"],
      ["15151515151","Pamukkale Üniversitesi","Akademik","Bölüm Başkanı","Doç. Dr.","","Okan","Erdoğan","Sosyal, Beşeri ve İdari Bilimler","Kamu Yönetimi",1,3,0,"YÖKAK dış değerlendirme, öz değerlendirme raporu yazımı","YDS 83","Doktora 2011","E"],
      ["16161616161","Trakya Üniversitesi","Akademik","Anabilim Dalı Başkanı","Dr. Öğr. Üyesi","","Pınar","Kurt","Eğitim Bilimleri","Ölçme ve Değerlendirme",0,0,0,"Kalite güvencesi çalışma grubu üyeliği","YDS 81","Doktora 2019","Y"],
      ["17171717171","Kocaeli Üniversitesi","Akademik","Bölüm Başkanı","Doç. Dr.","","Serkan","Polat","Mühendislik","Makine Mühendisliği",0,0,0,"","YDS 85","Doktora 2015","Y"],
      ["18181818181","İnönü Üniversitesi","Akademik","Dekan Yardımcısı","Prof. Dr.","","Gülay","Tekin","Fen Bilimleri ve Matematik","Matematik",1,4,0,"Dış değerlendirme, program değerlendirme","KPDS 87","Doktora 2003","E"],
      ["19191919191","Sakarya Üniversitesi","İdari","","","Kalite Koordinatörlüğü Şube Müdürü","Hakan","Doğan","","",0,2,3,"YÖKAK idari değerlendirici, ISO 9001 baş denetçi, KİDR hazırlama","YDS 72","Yüksek Lisans 2010","E"],
      ["20202020202","Ondokuz Mayıs Üniversitesi","İdari","","","Öğrenci İşleri Daire Başkanı","Nesrin","Kaplan","","",0,0,0,"Kalite komisyonu raportörlüğü","","Lisans 2005","Y"],
      ["21212121212","Ankara Üniversitesi","Öğrenci","","","","Berk","Yalçın","Sosyal, Beşeri ve İdari Bilimler","Hukuk",0,1,0,"YÖKAK öğrenci değerlendirici, kalite elçisi","YDS 78","Lisans öğrencisi (4. sınıf)","E"],
      ["22222222223","Ege Üniversitesi","Öğrenci","","","","Ceren","Acar","Sağlık Bilimleri","Tıp",0,0,0,"Öğrenci kalite topluluğu başkanı","IELTS 7","Lisans öğrencisi (5. sınıf)","Y"],
      ["23232323232","Gaziantep Üniversitesi","Öğrenci","","","","Umut","Sarı","Mühendislik","Endüstri Mühendisliği",0,0,0,"","YDS 66","Lisans öğrencisi (3. sınıf)","Y"]
    ];

    // Kalan satırlar deterministik olarak üretilir (toplam 300 kayıt).
    D = D.concat(ornekUret(300 - D.length, D.length));
    ingest([H].concat(D), "ornek-veri (uygulama içi, 300 kayıt)");
    bildir("Örnek veri yüklendi: 300 kayıt. Bu veri gerçek kişileri temsil etmez; yalnızca deneme amaçlıdır.", "ok");
  }

  // Deterministik sözde-rastgele örnek başvuru üreteci (H sütun sırasına uygun satırlar)
  function ornekUret(adet, tcOffset) {
    var seed = 20260713;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x80000000; }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    function sans(p) { return rnd() < p; }

    var adlar = ["Ahmet","Mehmet","Mustafa","Ali","Hüseyin","Hasan","İbrahim","Osman","Yusuf","Murat",
      "Ömer","Emre","Burak","Kemal","Serkan","Okan","Hakan","Umut","Kaan","Onur","Volkan","Cem","Barış",
      "Furkan","Selim","Erdem","Tolga","Uğur","Sinan","Levent","Ayşe","Fatma","Emine","Zeynep","Elif",
      "Meryem","Hatice","Merve","Selin","Pınar","Gülay","Nurcan","Ceren","Aslı","Büşra","Ebru","Derya",
      "Nesrin","Şeyma","Tuğba","Yasemin","Gamze","Esra","Melis","Dilek","Sibel","Nilüfer","Handan","Gizem"];
    var soyadlar = ["Yılmaz","Kaya","Demir","Şahin","Çelik","Yıldız","Yıldırım","Öztürk","Aydın","Arslan",
      "Doğan","Kılıç","Aslan","Çetin","Kara","Koç","Kurt","Özdemir","Şimşek","Aksoy","Polat","Erdoğan",
      "Güneş","Aydın","Bulut","Korkmaz","Güler","Yavuz","Can","Acar","Bozkurt","Taş","Uçar","Karadağ",
      "Ekinci","Sarı","Turan","Avcı","Baştürk","Tekin","Kaplan","Yalçın","Duman","Çakır"];
    var unis = (window.Universities && Universities.UNIVERSITIES || []).map(function (u) { return u.ad; });
    if (!unis.length) unis = ["Ankara Üniversitesi","Ege Üniversitesi","Gazi Üniversitesi","Hacettepe Üniversitesi","İstanbul Üniversitesi"];
    var temelAlanlar = ["Eğitim Bilimleri","Fen Bilimleri ve Matematik","Filoloji","Güzel Sanatlar","Hukuk",
      "İlahiyat","Mimarlık, Planlama ve Tasarım","Mühendislik","Sağlık Bilimleri","Sosyal, Beşeri ve İdari Bilimler",
      "Spor Bilimleri","Ziraat, Orman ve Su Ürünleri"];
    var bilim = {
      "Eğitim Bilimleri": ["Eğitim Yönetimi","Ölçme ve Değerlendirme","Rehberlik ve Psikolojik Danışmanlık","Sınıf Eğitimi"],
      "Fen Bilimleri ve Matematik": ["Matematik","Fizik","Kimya","Biyoloji","İstatistik"],
      "Filoloji": ["İngiliz Dili ve Edebiyatı","Türk Dili ve Edebiyatı","Dilbilim"],
      "Güzel Sanatlar": ["Resim","Müzik","Grafik Tasarım"],
      "Hukuk": ["Kamu Hukuku","Özel Hukuk"],
      "İlahiyat": ["Temel İslam Bilimleri","Din Kültürü ve Ahlak Bilgisi"],
      "Mimarlık, Planlama ve Tasarım": ["Mimarlık","Şehir ve Bölge Planlama","İç Mimarlık"],
      "Mühendislik": ["Bilgisayar Mühendisliği","İnşaat Mühendisliği","Makine Mühendisliği","Elektrik-Elektronik Mühendisliği","Endüstri Mühendisliği"],
      "Sağlık Bilimleri": ["Tıp","Hemşirelik","Eczacılık","Diş Hekimliği","Fizyoterapi ve Rehabilitasyon"],
      "Sosyal, Beşeri ve İdari Bilimler": ["İşletme","İktisat","Kamu Yönetimi","Psikoloji","Sosyoloji"],
      "Spor Bilimleri": ["Antrenörlük Eğitimi","Beden Eğitimi ve Spor"],
      "Ziraat, Orman ve Su Ürünleri": ["Tarla Bitkileri","Orman Mühendisliği","Su Ürünleri"]
    };
    var akademikGorevler = ["","","","","Bölüm Başkanı","Anabilim Dalı Başkanı","Dekan Yardımcısı","Dekan",
      "Enstitü Müdürü","MYO/Yüksekokul Müdürü","Bölüm Başkan Yardımcısı","Bologna Koordinatörü","Erasmus Koordinatörü",
      "Araştırma ve Uygulama Merkezi Müdürü","Rektör Yardımcısı"];
    var idariGorevler = ["Genel Sekreter","Strateji Geliştirme Daire Başkanı","Öğrenci İşleri Daire Başkanı",
      "Kalite Koordinatörlüğü Şube Müdürü","Personel Daire Başkanı","Bilgi İşlem Daire Başkanı","Yazı İşleri Müdürü"];
    var tecrubeParca = ["YÖKAK dış değerlendirme","kurumsal akreditasyon süreçleri","kalite komisyonu üyeliği",
      "MÜDEK program akreditasyonu değerlendiriciliği","KİDR hazırlama","iç tetkik","öz değerlendirme raporu",
      "ISO 9001 baş denetçi","Bologna ve AKTS süreçleri","program değerlendirme komisyonu","değerlendirici eğitimi",
      "takım üyeliği"];
    var dilSinav = ["YDS","YÖKDİL","KPDS","e-YDS"];

    function tecrubeUret(n) {
      if (!n) return "";
      var set = {};
      for (var i = 0; i < n; i++) set[pick(tecrubeParca)] = 1;
      return Object.keys(set).join(", ");
    }
    function dilUret(zorunlu) {
      if (!zorunlu && sans(0.15)) return "";
      if (sans(0.12)) return sans(0.5) ? "TOEFL iBT " + ri(72, 110) : "IELTS " + (ri(60, 85) / 10).toFixed(1).replace(".", ",");
      return pick(dilSinav) + " " + (ri(550, 980) / 10).toFixed(1).replace(".0", "").replace(".", ",");
    }

    var rows = [];
    for (var i = 0; i < adet; i++) {
      var tc = String(30000000000 + (tcOffset + i) * 137);
      var uni = pick(unis);
      var ad = pick(adlar), soyad = pick(soyadlar);
      var secim = sans(0.45) ? "E" : "Y";
      var tip = (i % 11 === 0) ? "Öğrenci" : (i % 6 === 0) ? "İdari" : "Akademik";
      var row;
      if (tip === "İdari") {
        var idrGor = ri(0, 4);
        row = [tc, uni, "İdari", "", "", pick(idariGorevler), ad, soyad, "", "",
               0, sans(0.3) ? ri(1, 3) : 0, idrGor,
               tecrubeUret(idrGor >= 2 ? ri(1, 3) : ri(0, 1)),
               dilUret(false), sans(0.5) ? "Yüksek Lisans " + ri(2005, 2018) : "Lisans " + ri(1995, 2012), secim];
      } else if (tip === "Öğrenci") {
        var alanO = pick(temelAlanlar);
        row = [tc, uni, "Öğrenci", "", "", "", ad, soyad, alanO, pick(bilim[alanO]),
               0, sans(0.25) ? 1 : 0, 0,
               sans(0.5) ? tecrubeUret(1) : "", dilUret(false),
               "Lisans öğrencisi (" + ri(2, 6) + ". sınıf)", secim];
      } else {
        var unvan = (function () {
          var r = rnd();
          return r < 0.25 ? "Prof. Dr." : r < 0.5 ? "Doç. Dr." : r < 0.75 ? "Dr. Öğr. Üyesi" : r < 0.9 ? "Öğr. Gör." : "Arş. Gör.";
        })();
        var alan = pick(temelAlanlar);
        var tk = 0, ak = 0;
        if (unvan === "Prof. Dr.") { tk = ri(0, 5); ak = ri(1, 8); }
        else if (unvan === "Doç. Dr.") { tk = ri(0, 2); ak = ri(0, 5); }
        else if (unvan === "Dr. Öğr. Üyesi") { tk = 0; ak = ri(0, 2); }
        var gorevSay = tk + ak;
        var ogr;
        if (unvan === "Prof. Dr." || unvan === "Doç. Dr." || unvan === "Dr. Öğr. Üyesi") {
          var dy = ri(1992, 2021); ogr = "Lisans " + (dy - ri(6, 10)) + ", Doktora " + dy;
        } else if (unvan === "Öğr. Gör.") ogr = "Yüksek Lisans " + ri(2008, 2020);
        else ogr = "Lisans " + ri(2015, 2021) + ", Yüksek Lisans " + ri(2021, 2024);
        row = [tc, uni, "Akademik", pick(akademikGorevler), unvan, "", ad, soyad, alan, pick(bilim[alan]),
               tk, ak, 0, tecrubeUret(gorevSay >= 3 ? ri(2, 3) : gorevSay >= 1 ? ri(1, 2) : (sans(0.4) ? 1 : 0)),
               dilUret(false), ogr, secim];
      }
      rows.push(row);
    }
    return rows;
  }

  // ---------------- Genel ----------------

  function bildir(mesaj, tur) {
    var div = $("toast");
    div.textContent = mesaj;
    div.className = "toast show " + (tur || "");
    clearTimeout(bildir._t);
    bildir._t = setTimeout(function () { div.className = "toast"; }, 6000);
  }

  function bindResults() {
    $("f-durum").addEventListener("change", function (e) { state.filtre.durum = e.target.value; renderTable(); });
    $("f-secim").addEventListener("change", function (e) { state.filtre.secim = e.target.value; renderTable(); });
    $("f-arama").addEventListener("input", function (e) { state.filtre.arama = e.target.value; renderTable(); });
    $("btn-export").addEventListener("click", function () {
      if (!state.analiz) return;
      Report.exportExcel(state.analiz, state.criteria);
    });
    $("modal-close").addEventListener("click", function () { $("modal").hidden = true; });
    $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) $("modal").hidden = true; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") $("modal").hidden = true; });
  }

  function init() {
    state.criteria = loadCriteria();
    renderCriteria();
    bindCriteriaControls();
    bindUpload();
    bindResults();
  }

  // Takım oluşturma modülünün havuza salt-okunur erişimi
  window.PoolAccess = {
    rows: function () { return state.rows || []; },
    // Modül 1 kriter puanı (0–100) veya null
    score: function (tc) {
      if (!state.scoreByTc) return null;
      var v = state.scoreByTc[String(tc).trim()];
      return v === undefined ? null : v;
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
