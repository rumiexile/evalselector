/*
 * teams-ui.js — Takım Oluşturma modülü arayüzü.
 * Kişisel veri içermeyen ayarlar (dönem, türler, şablonlar, kurum seçimi)
 * localStorage'da saklanır; takımlar ve ÇÇ beyanları yalnızca bellekte tutulur
 * ve "Çalışmayı kaydet (JSON)" ile dışa aktarılır (KVKK).
 */
(function () {
  "use strict";

  var LS_KEY = "evalselector.teams.v1";

  var T = {
    donem: "",
    aktifTur: "kddp",
    customTurler: [],   // {id, ad}
    sablonlar: {},      // turId -> template
    seciliKurumlar: [], // [kurum adı]
    ekKurumlar: [],     // {ad, il, tur}
    takimlar: {},       // kurum adı -> takım (Teams.bosTakim yapısı)
    coi: {}             // tc -> [kurum adları]
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function maskTc(tc) {
    var s = String(tc || "").trim();
    if (s.length < 6) return s;
    return s.slice(0, 3) + "*".repeat(s.length - 5) + s.slice(-2);
  }
  function bildir(mesaj, tur) {
    var div = $("toast");
    div.textContent = mesaj;
    div.className = "toast show " + (tur || "");
    clearTimeout(bildir._t);
    bildir._t = setTimeout(function () { div.className = "toast"; }, 6000);
  }

  // ---------------- Havuz erişimi ----------------
  function pool() {
    return (window.PoolAccess && window.PoolAccess.rows()) || [];
  }
  function poolIndex() {
    var m = {};
    pool().forEach(function (r) { var tc = Teams.tcOf(r); if (tc) m[tc] = r; });
    return m;
  }

  // ---------------- Kalıcılık ----------------
  function saveLS() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        donem: T.donem, aktifTur: T.aktifTur, customTurler: T.customTurler,
        sablonlar: T.sablonlar, seciliKurumlar: T.seciliKurumlar, ekKurumlar: T.ekKurumlar
      }));
    } catch (e) { /* yoksay */ }
  }
  function loadLS() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var v = JSON.parse(raw);
      if (typeof v.donem === "string") T.donem = v.donem;
      if (typeof v.aktifTur === "string") T.aktifTur = v.aktifTur;
      if (Array.isArray(v.customTurler)) T.customTurler = v.customTurler;
      if (v.sablonlar && typeof v.sablonlar === "object") T.sablonlar = v.sablonlar;
      if (Array.isArray(v.seciliKurumlar)) T.seciliKurumlar = v.seciliKurumlar;
      if (Array.isArray(v.ekKurumlar)) T.ekKurumlar = v.ekKurumlar;
    } catch (e) { /* bozuk kayıt yok sayılır */ }
  }

  // ---------------- Türler ve şablon ----------------
  function allTurler() { return Teams.DEFAULT_TYPES.concat(T.customTurler); }
  function turAdi(id) {
    var t = allTurler().find(function (x) { return x.id === id; });
    return t ? t.ad : id;
  }
  function template() {
    if (!T.sablonlar[T.aktifTur]) T.sablonlar[T.aktifTur] = Teams.defaultTemplate(T.aktifTur);
    return T.sablonlar[T.aktifTur];
  }

  function renderTur() {
    var sel = $("t-tur");
    sel.innerHTML = "";
    allTurler().forEach(function (t) {
      var o = document.createElement("option");
      o.value = t.id; o.textContent = t.ad;
      sel.appendChild(o);
    });
    if (!allTurler().some(function (t) { return t.id === T.aktifTur; })) T.aktifTur = allTurler()[0].id;
    sel.value = T.aktifTur;
    $("t-donem").value = T.donem;
    renderSablon();
  }

  function renderSablon() {
    var s = template();
    $("t-sablon-tur").textContent = turAdi(T.aktifTur) + " ";
    $("s-akademik").value = s.akademikSayisi;
    $("s-idari").checked = s.idariZorunlu;
    $("s-ogrenci").checked = s.ogrenciZorunlu;
    $("s-bsk-gorev").value = s.bskMinGorev;
    $("s-dil").value = s.minDilPuani;
    $("s-min-yeni").value = s.minYeni;
    $("s-max-yeni").value = s.maxYeni;
    $("s-yedek").value = s.yedekSayisi;
    $("s-ayni-kurum").checked = s.ayniKurumTek;
    $("t-toplam").textContent = "— takım büyüklüğü: " + Teams.takimBuyuklugu(s) + " kişi (başkan dâhil)";
  }

  function bindTur() {
    $("t-donem").addEventListener("change", function (e) { T.donem = e.target.value.trim(); saveLS(); renderTakimlar(); });
    $("t-tur").addEventListener("change", function (e) { T.aktifTur = e.target.value; saveLS(); renderSablon(); renderTakimlar(); });
    $("btn-tur-ekle").addEventListener("click", function () {
      var ad = $("t-yeni-tur").value.trim();
      if (!ad) { bildir("Tür adı boş olamaz.", "err"); return; }
      var id = "ozel-" + TextParse.norm(ad).replace(/\s+/g, "-").slice(0, 40);
      if (allTurler().some(function (t) { return t.id === id; })) { bildir("Bu tür zaten tanımlı.", "err"); return; }
      T.customTurler.push({ id: id, ad: ad });
      T.aktifTur = id;
      $("t-yeni-tur").value = "";
      saveLS(); renderTur(); renderTakimlar();
      bildir("\"" + ad + "\" türü öntanımlı şablonla eklendi; şablonu düzenleyebilirsiniz.", "ok");
    });

    function num(id, alan) {
      $(id).addEventListener("change", function (e) {
        var v = parseInt(e.target.value, 10);
        template()[alan] = isFinite(v) && v >= 0 ? v : 0;
        e.target.value = template()[alan];
        sablonDegisti();
      });
    }
    function chk(id, alan) {
      $(id).addEventListener("change", function (e) { template()[alan] = e.target.checked; sablonDegisti(); });
    }
    num("s-akademik", "akademikSayisi");
    chk("s-idari", "idariZorunlu");
    chk("s-ogrenci", "ogrenciZorunlu");
    num("s-bsk-gorev", "bskMinGorev");
    num("s-dil", "minDilPuani");
    num("s-min-yeni", "minYeni");
    num("s-max-yeni", "maxYeni");
    num("s-yedek", "yedekSayisi");
    chk("s-ayni-kurum", "ayniKurumTek");

    $("btn-sablon-reset").addEventListener("click", function () {
      T.sablonlar[T.aktifTur] = Teams.defaultTemplate(T.aktifTur);
      sablonDegisti();
      bildir("Şablon öntanımlı değerlere döndürüldü.", "ok");
    });
  }

  function sablonDegisti() {
    saveLS(); renderSablon(); renderTakimlar();
  }

  // ---------------- Kurumlar ----------------
  function tumKurumlar() {
    return Universities.UNIVERSITIES.concat(T.ekKurumlar);
  }
  function kurumBilgi(ad) {
    var n = TextParse.norm(ad);
    return tumKurumlar().find(function (k) { return TextParse.norm(k.ad) === n; }) || null;
  }

  // Şehir (+ Türkiye dışıysa ülke) gösterimi
  function yerBilgisi(k) {
    var ulke = k.ulke && k.ulke !== "Türkiye" ? " · " + k.ulke : "";
    return k.il + ulke;
  }

  function renderUlkeSecenekleri() {
    var sel = $("k-yeni-ulke");
    sel.innerHTML = "";
    Universities.COUNTRIES.forEach(function (ulke) {
      var o = document.createElement("option");
      o.value = ulke; o.textContent = ulke;
      sel.appendChild(o);
    });
    sel.value = "Türkiye";
  }

  function renderKurumlar() {
    var arama = TextParse.norm($("k-arama").value);
    var turF = $("k-tur-filtre").value;
    var div = $("kurum-liste");
    div.innerHTML = "";
    var secili = {};
    T.seciliKurumlar.forEach(function (a) { secili[TextParse.norm(a)] = true; });
    tumKurumlar()
      .filter(function (k) {
        if (turF !== "hepsi" && k.tur !== turF) return false;
        if (arama && TextParse.norm(k.ad + " " + k.il).indexOf(arama) === -1) return false;
        return true;
      })
      .sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); })
      .forEach(function (k) {
        var lbl = document.createElement("label");
        lbl.className = "chk";
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!secili[TextParse.norm(k.ad)];
        cb.addEventListener("change", function () { kurumSecim(k.ad, cb.checked); });
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(" " + k.ad));
        var span = document.createElement("span");
        span.className = "hint";
        span.textContent = " — " + yerBilgisi(k) + " · " + k.tur;
        lbl.appendChild(span);
        div.appendChild(lbl);
      });
    renderSeciliKurumlar();
  }

  function kurumSecim(ad, secildi) {
    var n = TextParse.norm(ad);
    T.seciliKurumlar = T.seciliKurumlar.filter(function (a) { return TextParse.norm(a) !== n; });
    if (secildi) T.seciliKurumlar.push(ad);
    else if (T.takimlar[ad]) {
      delete T.takimlar[ad]; // kurum listeden çıkarılırsa takımı da kaldırılır
      bildir("\"" + ad + "\" seçimden çıkarıldı; kurulmuş takımı silindi.", "");
    }
    saveLS(); renderKurumlar(); renderTakimlar();
  }

  function renderSeciliKurumlar() {
    $("k-secili-sayi").textContent = T.seciliKurumlar.length;
    var div = $("kurum-secili");
    div.innerHTML = "";
    T.seciliKurumlar.slice().sort(function (a, b) { return a.localeCompare(b, "tr"); }).forEach(function (ad) {
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = ad + " ";
      var x = document.createElement("button");
      x.type = "button"; x.className = "chip-x"; x.textContent = "×";
      x.setAttribute("aria-label", ad + " kurumunu çıkar");
      x.addEventListener("click", function () { kurumSecim(ad, false); });
      chip.appendChild(x);
      div.appendChild(chip);
    });
  }

  function bindKurumlar() {
    $("k-arama").addEventListener("input", renderKurumlar);
    $("k-tur-filtre").addEventListener("change", renderKurumlar);
    $("btn-kurum-ekle").addEventListener("click", function () {
      var ad = $("k-yeni-ad").value.trim();
      if (!ad) { bildir("Kurum adı boş olamaz.", "err"); return; }
      if (kurumBilgi(ad)) { bildir("Bu kurum zaten listede.", "err"); return; }
      T.ekKurumlar.push({
        ad: ad, il: $("k-yeni-sehir").value.trim() || "—",
        tur: $("k-yeni-tur").value, ulke: $("k-yeni-ulke").value
      });
      $("k-yeni-ad").value = ""; $("k-yeni-sehir").value = "";
      $("k-yeni-ulke").value = "Türkiye";
      kurumSecim(ad, true);
      renderCoiKurumListesi();
      bildir("\"" + ad + "\" listeye eklendi ve seçildi.", "ok");
    });
  }

  // ---------------- Takımlar ----------------
  function atananlarSet(haricKurum) {
    var s = new Set();
    Object.keys(T.takimlar).forEach(function (kurum) {
      if (kurum === haricKurum) return;
      Teams.asilTcleri(T.takimlar[kurum]).forEach(function (tc) { s.add(tc); });
    });
    return s;
  }

  function autoBuild(kurum) {
    var sonuc = Teams.autoAssign(pool(), kurum, T.aktifTur, T.donem, template(), {
      coiMap: T.coi, atananlar: atananlarSet(kurum)
    });
    T.takimlar[kurum] = sonuc.takim;
    return sonuc.uyarilar;
  }

  function renderHavuzDurum() {
    var div = $("havuz-durum");
    var rows = pool();
    if (!rows.length) {
      div.innerHTML = '<p class="warn">Değerlendirici havuzu boş. Takım kurabilmek için 1. modülden ' +
        'başvuru dosyasını yükleyiniz ya da "Örnek veriyle dene" seçeneğini kullanınız.</p>';
      return;
    }
    var sayilar = { akademik: 0, idari: 0, ogrenci: 0, diger: 0 };
    rows.forEach(function (r) { sayilar[Teams.tipOf(r)]++; });
    div.innerHTML = "<p>Havuz: <strong>" + rows.length + "</strong> kayıt — akademik: " +
      sayilar.akademik + ", idari: " + sayilar.idari + ", öğrenci: " + sayilar.ogrenci +
      (sayilar.diger ? ", tanımsız tip: " + sayilar.diger : "") + ".</p>" +
      (T.donem ? "" : '<p class="warn">Dönem adı tanımlanmadı; raporlarda boş görünecektir.</p>');
  }

  function uyeChip(tc, rol, kurum, yedekMi) {
    var idx = poolIndex();
    var row = idx[tc];
    var s = template();
    var html = '<div class="uye' + (yedekMi ? " uye-yedek" : "") + '">';
    if (!row) {
      html += '<span class="uye-ad warn">TcNo ' + esc(maskTc(tc)) + '</span>' +
              '<span class="uye-alt warn">Havuz verisinde bulunamadı</span>';
    } else {
      var rozetler = [];
      if (Teams.isYeni(row)) rozetler.push('<span class="rozet r-yeni">İlk kez</span>');
      var dil = Teams.dilPuani(row);
      if (dil !== null) rozetler.push('<span class="rozet r-dil">Dil ' + dil + "</span>");
      var coi = Teams.coiSebebi(row, kurum, T.coi);
      if (coi) rozetler.push('<span class="rozet r-coi" title="' + esc(coi) + '">ÇÇ!</span>');
      var rs = Teams.rolSebebi(row, rol, s);
      if (rs) rozetler.push('<span class="rozet r-coi" title="' + esc(rs) + '">Kriter!</span>');
      html += '<span class="uye-ad">' + esc((row["Ad"] || "") + " " + (row["Soyad"] || "")) + " " + rozetler.join(" ") + "</span>" +
              '<span class="uye-alt">' + esc(row["Universite"] || "") +
              (row["AkademikUnvan"] ? " · " + esc(row["AkademikUnvan"]) : "") +
              " · Görev: " + Teams.gorevSayisi(row) + "</span>";
    }
    html += "</div>";
    return html;
  }

  function renderTakimlar() {
    var div = $("takim-listesi");
    div.innerHTML = "";
    if (!T.seciliKurumlar.length) {
      div.innerHTML = '<p class="hint">Takım kurmak için önce yukarıdan değerlendirilecek kurumları seçiniz.</p>';
      renderHavuzDurum(); renderCoiAdaylar();
      return;
    }
    var idx = poolIndex();
    T.seciliKurumlar.slice().sort(function (a, b) { return a.localeCompare(b, "tr"); }).forEach(function (kurum) {
      var takim = T.takimlar[kurum];
      var kb = kurumBilgi(kurum);
      var card = document.createElement("div");
      card.className = "team-card";
      var head = '<div class="team-head"><div><strong>' + esc(kurum) + "</strong>" +
        (kb ? ' <span class="hint">' + esc(yerBilgisi(kb)) + " · " + esc(kb.tur) + "</span>" : "") +
        (takim ? ' <span class="hint">— ' + esc(turAdi(takim.turId)) +
          (takim.donem ? " · " + esc(takim.donem) : "") + "</span>" : "") +
        "</div><div class='team-actions'>";
      if (takim) {
        head += '<button type="button" class="btn-mini" data-act="yeniden">Yeniden kur</button>' +
                '<button type="button" class="btn-mini" data-act="sil">Takımı sil</button>';
      } else {
        head += '<button type="button" class="btn-mini" data-act="oto">Otomatik kur</button>' +
                '<button type="button" class="btn-mini" data-act="bos">Boş takım</button>';
      }
      head += "</div></div>";
      card.innerHTML = head;

      if (takim) {
        var s = takim.sablon;
        var govde = document.createElement("div");
        var satirlar = [];
        // (rol, etiket, tc|null, akademik dizini)
        satirlar.push(["baskan", Teams.ROL_LABELS.baskan, takim.asil.baskan, -1]);
        for (var i = 0; i < s.akademikSayisi; i++) {
          satirlar.push(["akademik", Teams.ROL_LABELS.akademik + " " + (i + 1),
                         takim.asil.akademik[i] || null, i]);
        }
        if (s.idariZorunlu) satirlar.push(["idari", Teams.ROL_LABELS.idari, takim.asil.idari, -1]);
        if (s.ogrenciZorunlu) satirlar.push(["ogrenci", Teams.ROL_LABELS.ogrenci, takim.asil.ogrenci, -1]);

        function yedekSatiri(rol) {
          var yedekler = takim.yedek[rol] || [];
          return '<tr class="yedek-satir"><th class="hint">' + esc(Teams.ROL_LABELS[rol]) + ' yedeği</th><td>' +
            (yedekler.length ? yedekler.map(function (ytc) {
              return '<div class="yedek-item">' + uyeChip(ytc, rol, kurum, true) +
                '<span class="yedek-btns">' +
                '<button type="button" class="btn-mini" data-yasil-rol="' + rol + '" data-yasil-tc="' + esc(ytc) + '">Asil yap</button>' +
                '<button type="button" class="btn-mini" data-ysil-rol="' + rol + '" data-ysil-tc="' + esc(ytc) + '">Çıkar</button>' +
                "</span></div>";
            }).join("") : '<span class="hint">—</span>') +
            '</td><td class="slot-btn"><button type="button" class="btn-mini" data-yekle-rol="' + rol + '">Yedek ekle</button></td></tr>';
        }

        var tbl = '<table class="slot-tablo"><tbody>';
        satirlar.forEach(function (sat) {
          var rol = sat[0], etiket = sat[1], tc = sat[2], ai = sat[3];
          tbl += '<tr><th>' + esc(etiket) + "</th><td>" +
            (tc ? uyeChip(tc, rol, kurum, false) : '<span class="hint">— boş —</span>') +
            '</td><td class="slot-btn"><button type="button" class="btn-mini" data-slot-rol="' + rol +
            '" data-slot-ai="' + ai + '">' + (tc ? "Değiştir" : "Seç") + "</button></td></tr>";
        });
        ["baskan", "akademik", "idari", "ogrenci"].forEach(function (rol) {
          if (rol === "idari" && !s.idariZorunlu) return;
          if (rol === "ogrenci" && !s.ogrenciZorunlu) return;
          tbl += yedekSatiri(rol);
        });
        tbl += "</tbody></table>";
        govde.innerHTML = tbl;
        card.appendChild(govde);

        var uyarilar = Teams.validateTeam(takim, pool(), { coiMap: T.coi, digerAsiller: atananlarSet(kurum) });
        var udiv = document.createElement("div");
        udiv.className = "team-uyari " + (uyarilar.length ? "" : "team-uygun");
        udiv.innerHTML = uyarilar.length
          ? "<strong>Uyarılar:</strong><ul>" + uyarilar.map(function (u) { return "<li>" + esc(u) + "</li>"; }).join("") + "</ul>"
          : "Takım, şablon kurallarına uygun. ✓";
        card.appendChild(udiv);
      }

      // Olay bağlama
      card.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.act === "oto" || b.dataset.act === "yeniden") {
          if (!pool().length) { bildir("Havuz boş; önce başvuru dosyası yükleyiniz.", "err"); return; }
          var uy = autoBuild(kurum);
          renderTakimlar();
          bildir(uy.length ? kurum + ": takım kuruldu; " + uy.length + " uyarı var." : kurum + ": takım kuruldu.", uy.length ? "" : "ok");
        } else if (b.dataset.act === "bos") {
          T.takimlar[kurum] = Teams.bosTakim(kurum, T.aktifTur, T.donem, template());
          renderTakimlar();
        } else if (b.dataset.act === "sil") {
          if (confirm("\"" + kurum + "\" takımı silinecek. Onaylıyor musunuz?")) {
            delete T.takimlar[kurum];
            renderTakimlar();
          }
        } else if (b.dataset.slotRol) {
          openPicker(kurum, b.dataset.slotRol, parseInt(b.dataset.slotAi, 10), "asil");
        } else if (b.dataset.yekleRol) {
          openPicker(kurum, b.dataset.yekleRol, -1, "yedek");
        } else if (b.dataset.yasilRol) {
          yedegiAsilYap(kurum, b.dataset.yasilRol, b.dataset.yasilTc);
        } else if (b.dataset.ysilRol) {
          var tk = T.takimlar[kurum];
          tk.yedek[b.dataset.ysilRol] = tk.yedek[b.dataset.ysilRol].filter(function (x) { return x !== b.dataset.ysilTc; });
          renderTakimlar();
        }
      });

      div.appendChild(card);
    });
    renderHavuzDurum();
    renderCoiAdaylar();
  }

  function yedegiAsilYap(kurum, rol, tc) {
    var tk = T.takimlar[kurum];
    tk.yedek[rol] = tk.yedek[rol].filter(function (x) { return x !== tc; });
    var eski = null;
    if (rol === "baskan") { eski = tk.asil.baskan; tk.asil.baskan = tc; }
    else if (rol === "idari") { eski = tk.asil.idari; tk.asil.idari = tc; }
    else if (rol === "ogrenci") { eski = tk.asil.ogrenci; tk.asil.ogrenci = tc; }
    else {
      // ilk boş akademik koltuğa, yoksa son koltukla yer değiştir
      var i = tk.asil.akademik.findIndex(function (x) { return !x; });
      if (i === -1 && tk.asil.akademik.length < tk.sablon.akademikSayisi) tk.asil.akademik.push(tc);
      else {
        if (i === -1) i = tk.asil.akademik.length - 1;
        eski = tk.asil.akademik[i];
        tk.asil.akademik[i] = tc;
      }
    }
    if (eski) tk.yedek[rol].push(eski);
    renderTakimlar();
    bildir(eski ? "Yedek üye asil yapıldı; önceki asil aynı rolün yedeğine alındı." : "Yedek üye asil olarak atandı.", "ok");
  }

  // ---------------- Aday seçim penceresi ----------------
  function openPicker(kurum, rol, akademikIdx, mod) {
    var takim = T.takimlar[kurum];
    var s = takim.sablon;
    var kurumlar = [];
    var idx = poolIndex();
    Teams.asilTcleri(takim).forEach(function (tc) {
      if (idx[tc]) kurumlar.push(idx[tc]["Universite"]);
    });
    var ctx = {
      coiMap: T.coi,
      atananlar: mod === "asil" ? atananlarSet(kurum) : null,
      takimTcler: Teams.takimTcleri(takim),
      takimKurumlari: mod === "asil" && s.ayniKurumTek ? kurumlar : null
    };
    var sonuc = Teams.uygunAdaylar(pool(), rol, kurum, s, ctx);

    var html = "<h3>" + esc(kurum) + "</h3><p class='hint'>" +
      esc(Teams.ROL_LABELS[rol]) + " — " + (mod === "asil" ? "asil üye seçimi" : "yedek ekleme") +
      ". Liste, şablon kriterleri ve çıkar çatışması kontrolünden geçenleri gösterir.</p>" +
      '<input type="search" id="picker-arama" placeholder="Ad veya üniversite ara…" class="picker-arama">' +
      '<div id="picker-liste" class="picker-liste"></div>';
    if (sonuc.red.length) {
      html += "<details><summary class='hint'>Elenen adaylar (" + sonuc.red.length + ")</summary><ul class='hint'>" +
        sonuc.red.slice(0, 60).map(function (r) {
          return "<li>" + esc(((r.row["Ad"] || "") + " " + (r.row["Soyad"] || "")).trim()) + " — " + esc(r.sebep) + "</li>";
        }).join("") + (sonuc.red.length > 60 ? "<li>…</li>" : "") + "</ul></details>";
    }
    $("modal-body").innerHTML = html;
    $("modal").hidden = false;

    function listele() {
      var q = TextParse.norm($("picker-arama").value);
      var kutu = $("picker-liste");
      kutu.innerHTML = "";
      var liste = sonuc.uygun.filter(function (r) {
        if (!q) return true;
        return TextParse.norm((r["Ad"] || "") + " " + (r["Soyad"] || "") + " " + (r["Universite"] || "")).indexOf(q) !== -1;
      });
      if (!liste.length) {
        kutu.innerHTML = '<p class="hint">Uygun aday bulunamadı.</p>';
        return;
      }
      liste.forEach(function (r) {
        var tc = Teams.tcOf(r);
        var item = document.createElement("div");
        item.className = "picker-item";
        item.innerHTML = uyeChip(tc, rol, kurum, false) +
          '<button type="button" class="btn-mini">' + (mod === "asil" ? "Seç" : "Yedek ekle") + "</button>";
        item.querySelector("button").addEventListener("click", function () {
          if (mod === "asil") {
            if (rol === "baskan") takim.asil.baskan = tc;
            else if (rol === "idari") takim.asil.idari = tc;
            else if (rol === "ogrenci") takim.asil.ogrenci = tc;
            else {
              if (akademikIdx >= 0 && akademikIdx < takim.asil.akademik.length) takim.asil.akademik[akademikIdx] = tc;
              else takim.asil.akademik.push(tc);
            }
          } else {
            takim.yedek[rol].push(tc);
          }
          $("modal").hidden = true;
          renderTakimlar();
        });
        kutu.appendChild(item);
      });
    }
    $("picker-arama").addEventListener("input", listele);
    listele();
  }

  // ---------------- ÇÇ beyanları ----------------
  function renderCoiAdaylar() {
    var sel = $("coi-aday");
    var onceki = sel.value;
    sel.innerHTML = '<option value="">Değerlendirici seçiniz…</option>';
    pool().forEach(function (r) {
      var tc = Teams.tcOf(r);
      if (!tc) return;
      var o = document.createElement("option");
      o.value = tc;
      o.textContent = ((r["Ad"] || "") + " " + (r["Soyad"] || "")).trim() + " (" + maskTc(tc) + ")";
      sel.appendChild(o);
    });
    if (onceki) sel.value = onceki;
    renderCoiListe();
  }

  function renderCoiKurumListesi() {
    var dl = $("coi-kurum-listesi");
    dl.innerHTML = "";
    tumKurumlar().forEach(function (k) {
      var o = document.createElement("option");
      o.value = k.ad;
      dl.appendChild(o);
    });
  }

  function renderCoiListe() {
    var div = $("coi-liste");
    div.innerHTML = "";
    var idx = poolIndex();
    Object.keys(T.coi).forEach(function (tc) {
      (T.coi[tc] || []).forEach(function (kurum) {
        var r = idx[tc];
        var ad = r ? ((r["Ad"] || "") + " " + (r["Soyad"] || "")).trim() : "TcNo " + maskTc(tc);
        var chip = document.createElement("span");
        chip.className = "chip chip-coi";
        chip.textContent = ad + " ↮ " + kurum + " ";
        var x = document.createElement("button");
        x.type = "button"; x.className = "chip-x"; x.textContent = "×";
        x.setAttribute("aria-label", "Beyanı kaldır");
        x.addEventListener("click", function () {
          T.coi[tc] = (T.coi[tc] || []).filter(function (k) { return k !== kurum; });
          if (!T.coi[tc].length) delete T.coi[tc];
          renderTakimlar();
        });
        chip.appendChild(x);
        div.appendChild(chip);
      });
    });
    if (!div.children.length) div.innerHTML = '<span class="hint">Kayıtlı beyan yok.</span>';
  }

  function bindCoi() {
    $("btn-coi-ekle").addEventListener("click", function () {
      var tc = $("coi-aday").value;
      var kurum = $("coi-kurum").value.trim();
      if (!tc || !kurum) { bildir("Değerlendirici ve kurum seçiniz.", "err"); return; }
      T.coi[tc] = T.coi[tc] || [];
      if (T.coi[tc].some(function (k) { return TextParse.norm(k) === TextParse.norm(kurum); })) {
        bildir("Bu beyan zaten kayıtlı.", "err"); return;
      }
      T.coi[tc].push(kurum);
      $("coi-kurum").value = "";
      renderTakimlar();
      bildir("Çıkar çatışması beyanı eklendi; takım doğrulamaları güncellendi.", "ok");
    });
  }

  // ---------------- Dışa / içe aktarma ----------------
  function exportTeamsExcel() {
    var kurumlar = Object.keys(T.takimlar);
    if (!kurumlar.length) { bildir("Dışa aktarılacak takım yok.", "err"); return; }
    var idx = poolIndex();
    var satirlar = [], ozet = [];

    function kisiSatiri(kurum, takim, rol, tc, durum) {
      var r = idx[tc] || {};
      return {
        "Dönem": takim.donem || T.donem, "Değerlendirme Türü": turAdi(takim.turId),
        "Kurum": kurum, "Rol": Teams.ROL_LABELS[rol], "Asil/Yedek": durum,
        "TcNo": r["TcNo"] || tc, "Ad": r["Ad"] || "", "Soyad": r["Soyad"] || "",
        "Üniversitesi": r["Universite"] || "", "Unvan": r["AkademikUnvan"] || "",
        "Tip": r["Tip"] || "", "Görev Sayısı": idx[tc] ? Teams.gorevSayisi(r) : "",
        "İlk Kez": idx[tc] ? (Teams.isYeni(r) ? "Evet" : "Hayır") : "",
        "Dil Puanı (100'lük)": idx[tc] && Teams.dilPuani(r) !== null ? Teams.dilPuani(r) : ""
      };
    }

    kurumlar.sort(function (a, b) { return a.localeCompare(b, "tr"); }).forEach(function (kurum) {
      var tk = T.takimlar[kurum];
      if (tk.asil.baskan) satirlar.push(kisiSatiri(kurum, tk, "baskan", tk.asil.baskan, "Asil"));
      tk.asil.akademik.forEach(function (tc) { if (tc) satirlar.push(kisiSatiri(kurum, tk, "akademik", tc, "Asil")); });
      if (tk.asil.idari) satirlar.push(kisiSatiri(kurum, tk, "idari", tk.asil.idari, "Asil"));
      if (tk.asil.ogrenci) satirlar.push(kisiSatiri(kurum, tk, "ogrenci", tk.asil.ogrenci, "Asil"));
      ["baskan", "akademik", "idari", "ogrenci"].forEach(function (rol) {
        (tk.yedek[rol] || []).forEach(function (tc) { satirlar.push(kisiSatiri(kurum, tk, rol, tc, "Yedek")); });
      });
      var uyarilar = Teams.validateTeam(tk, pool(), { coiMap: T.coi, digerAsiller: atananlarSet(kurum) });
      ozet.push({
        "Kurum": kurum, "Değerlendirme Türü": turAdi(tk.turId), "Dönem": tk.donem || T.donem,
        "Takım Büyüklüğü (şablon)": Teams.takimBuyuklugu(tk.sablon),
        "Durum": uyarilar.length ? "Uyarı var" : "Kurallara uygun",
        "Uyarılar": uyarilar.join(" | ")
      });
    });

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ozet), "Özet");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(satirlar), "Takımlar");
    var tarih = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, "degerlendirme-takimlari-" + tarih + ".xlsx");
  }

  function saveWork() {
    var veri = {
      surum: 1, kayitTarihi: new Date().toISOString(),
      donem: T.donem, aktifTur: T.aktifTur, customTurler: T.customTurler,
      sablonlar: T.sablonlar, seciliKurumlar: T.seciliKurumlar,
      ekKurumlar: T.ekKurumlar, takimlar: T.takimlar, coi: T.coi
    };
    var blob = new Blob([JSON.stringify(veri, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "takim-calismasi-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    bildir("Çalışma dosyası indirildi. Dosya kişisel veri (TcNo) içerir; güvenli saklayınız.", "ok");
  }

  function loadWork(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var v = JSON.parse(fr.result);
        if (typeof v.donem === "string") T.donem = v.donem;
        if (typeof v.aktifTur === "string") T.aktifTur = v.aktifTur;
        if (Array.isArray(v.customTurler)) T.customTurler = v.customTurler;
        if (v.sablonlar && typeof v.sablonlar === "object") T.sablonlar = v.sablonlar;
        if (Array.isArray(v.seciliKurumlar)) T.seciliKurumlar = v.seciliKurumlar;
        if (Array.isArray(v.ekKurumlar)) T.ekKurumlar = v.ekKurumlar;
        if (v.takimlar && typeof v.takimlar === "object") T.takimlar = v.takimlar;
        if (v.coi && typeof v.coi === "object") T.coi = v.coi;
        saveLS(); renderTur(); renderKurumlar(); renderTakimlar(); renderCoiKurumListesi();
        bildir("Çalışma yüklendi. Üye bilgilerinin görünmesi için ilgili başvuru dosyasının da yüklü olması gerekir.", "ok");
      } catch (e) {
        bildir("Çalışma dosyası okunamadı: geçerli bir JSON değil.", "err");
      }
    };
    fr.readAsText(file);
  }

  function bindTakimlar() {
    $("btn-oto-hepsi").addEventListener("click", function () {
      if (!pool().length) { bildir("Havuz boş; önce başvuru dosyası yükleyiniz.", "err"); return; }
      if (!T.seciliKurumlar.length) { bildir("Önce değerlendirilecek kurumları seçiniz.", "err"); return; }
      var kuruldu = 0, uyarili = 0;
      T.seciliKurumlar.forEach(function (kurum) {
        if (T.takimlar[kurum]) return; // mevcut takımlara dokunulmaz
        var uy = autoBuild(kurum);
        kuruldu++;
        if (uy.length) uyarili++;
      });
      renderTakimlar();
      bildir(kuruldu ? kuruldu + " takım rastlantısal yöntemle kuruldu" +
        (uyarili ? " (" + uyarili + " takımda uyarı var)." : ".") :
        "Kurulacak eksik takım yok; mevcut takımlar korundu.", kuruldu && !uyarili ? "ok" : "");
    });
    $("btn-takim-excel").addEventListener("click", exportTeamsExcel);
    $("btn-calisma-kaydet").addEventListener("click", saveWork);
    $("calisma-file").addEventListener("change", function (e) {
      if (e.target.files.length) loadWork(e.target.files[0]);
      e.target.value = "";
    });
  }

  // ---------------- Modül sekmeleri ----------------
  function bindTabs() {
    document.querySelectorAll(".modtab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".modtab").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        $("mod-secim").hidden = btn.dataset.mod !== "secim";
        $("mod-takim").hidden = btn.dataset.mod !== "takim";
        if (btn.dataset.mod === "takim") renderTakimlar();
      });
    });
  }

  // ---------------- Başlatma ----------------
  function init() {
    loadLS();
    bindTabs();
    bindTur();
    bindKurumlar();
    bindTakimlar();
    bindCoi();
    renderTur();
    renderUlkeSecenekleri();
    renderKurumlar();
    renderCoiKurumListesi();
    renderTakimlar();
    document.addEventListener("pool-updated", function () {
      renderTakimlar();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
