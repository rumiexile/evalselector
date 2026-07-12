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
      if (!confirm("Tüm kriterler öntanımlı değerlere döndürülecek. Onaylıyor musunuz?")) return;
      state.criteria = Criteria.cloneCriteria(Criteria.DEFAULT_CRITERIA);
      renderCriteria();
      criteriaChanged();
    });

    $("btn-export-criteria").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state.criteria, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "kriter-seti.json";
      a.click();
      URL.revokeObjectURL(a.href);
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
    renderSummary();
    renderTable();
    $("results-section").hidden = false;
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
    ingest([H].concat(D), "ornek-veri (uygulama içi)");
    bildir("Örnek veri yüklendi. Bu veri gerçek kişileri temsil etmez; yalnızca deneme amaçlıdır.", "ok");
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
  window.PoolAccess = { rows: function () { return state.rows || []; } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
