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
    takimlar: {},       // kurum adı -> takım (Teams.bosTakim yapısı; yalnızca asil)
    yedekHavuzu: {},    // turId -> { baskan:[tc], akademik:[tc], idari:[tc], ogrenci:[tc] }
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
  // Uygulama-içi onay (sandbox iframe'de native confirm engellenir); Promise<boolean>
  function onay(mesaj, opts) {
    return window.uiConfirm ? window.uiConfirm(mesaj, opts) : Promise.resolve(window.confirm(mesaj));
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

  // ---------------- Yedek havuzu (türe göre) ----------------
  var ROLLER = ["baskan", "akademik", "idari", "ogrenci"];

  function havuzOf(turId) {
    if (!T.yedekHavuzu[turId]) T.yedekHavuzu[turId] = { baskan: [], akademik: [], idari: [], ogrenci: [] };
    return T.yedekHavuzu[turId];
  }
  function havuzTumTcler() {
    var s = new Set();
    Object.keys(T.yedekHavuzu).forEach(function (turId) {
      ROLLER.forEach(function (rol) { (T.yedekHavuzu[turId][rol] || []).forEach(function (tc) { s.add(tc); }); });
    });
    return s;
  }

  // ---------------- Takımlar ----------------
  // Dönem içinde tek görev kuralı: bir kişi aynı anda tek yerde olabilir.
  // "Bağlı" kişiler = tüm takımların asilleri + tüm yedek havuzlarındaki kişiler.
  // Bu küme her yeni seçimden dışlanır. opts ile belirli bir bağlam hariç tutulur:
  //   { haricKurum: takım asilini hariç tut, haricHavuz: {turId, rol} havuz kovasını hariç tut }
  function bagliTcler(opts) {
    opts = opts || {};
    var s = new Set();
    Object.keys(T.takimlar).forEach(function (kurum) {
      if (kurum === opts.haricKurum) return;
      Teams.asilTcleri(T.takimlar[kurum]).forEach(function (tc) { s.add(tc); });
    });
    Object.keys(T.yedekHavuzu).forEach(function (turId) {
      ROLLER.forEach(function (rol) {
        if (opts.haricHavuz && opts.haricHavuz.turId === turId && opts.haricHavuz.rol === rol) return;
        (T.yedekHavuzu[turId][rol] || []).forEach(function (tc) { s.add(tc); });
      });
    });
    return s;
  }

  function autoBuild(kurum) {
    var sonuc = Teams.autoAssign(pool(), kurum, T.aktifTur, T.donem, template(), {
      coiMap: T.coi, atananlar: bagliTcler({ haricKurum: kurum })
    });
    T.takimlar[kurum] = sonuc.takim;
    return sonuc.uyarilar;
  }

  // ---------------- Yedek havuzu doldurma / düzenleme ----------------
  // Aktif türün havuzunu, rol başına şablondaki yedekSayisi kadar uygun
  // (bağlı olmayan) değerlendiriciyle rastlantısal olarak doldurur/tamamlar.
  function autoFillHavuz() {
    var turId = T.aktifTur, t = template(), hav = havuzOf(turId);
    var eklenen = 0, eksik = [];
    ROLLER.forEach(function (rol) {
      if (rol === "idari" && !t.idariZorunlu) return;
      if (rol === "ogrenci" && !t.ogrenciZorunlu) return;
      var hedef = t.yedekSayisi * (rol === "akademik" ? Math.max(1, Math.ceil(t.akademikSayisi / 2)) : 1);
      var eksikSayi = hedef - hav[rol].length;
      for (var k = 0; k < eksikSayi; k++) {
        // Havuz üyeleri bir kuruma bağlı değildir; ÇÇ ve aynı-kurum kuralları
        // yalnızca "Değiştir" ile bir takıma yerleştirilirken uygulanır.
        var ctx = { atananlar: bagliTcler(), takimTcler: new Set(hav[rol]) };
        var uygun = Teams.uygunAdaylar(pool(), rol, "", t, ctx).uygun;
        var karisik = Teams.shuffle(uygun);
        if (!karisik.length) { eksik.push(Teams.ROL_LABELS[rol]); break; }
        hav[rol].push(Teams.tcOf(karisik[0]));
        eklenen++;
      }
    });
    return { eklenen: eklenen, eksik: eksik };
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

  function uyeChip(tc, rol, kurum, yedekMi, tiklanabilir) {
    var idx = poolIndex();
    var row = idx[tc];
    var s = template();
    // Takım kartındaki, havuz verisi olan üyeler tıklanınca profil açılır (data-uye-tc)
    var acilir = row && tiklanabilir;
    var tikla = acilir ? ' data-uye-tc="' + esc(tc) + '" title="Profili gör" role="button" tabindex="0"' : "";
    var html = '<div class="uye' + (yedekMi ? " uye-yedek" : "") + (acilir ? " uye-tikla" : "") + '"' + tikla + ">";
    if (!row) {
      html += '<span class="uye-ad warn">TcNo ' + esc(maskTc(tc)) + '</span>' +
              '<span class="uye-alt warn">Havuz verisinde bulunamadı</span>';
    } else {
      var rozetler = [];
      var puan = window.PoolAccess && window.PoolAccess.score ? window.PoolAccess.score(tc) : null;
      if (puan !== null && puan !== undefined) {
        rozetler.push('<span class="rozet r-puan" title="Değerlendirici seçim kriter puanı (0–100)">Puan ' + puan + "</span>");
      }
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

  // Takıma yerleştirilmiş bir üyenin profilini #modal içinde gösterir.
  function showUyeProfil(tc) {
    var row = poolIndex()[tc];
    if (!row) { bildir("Bu kişinin havuz verisi bulunamadı.", "err"); return; }
    var tip = Teams.tipOf(row);
    var tipEt = { akademik: "Akademik", idari: "İdari", ogrenci: "Öğrenci", diger: row["Tip"] || "—" }[tip];

    var rozet = [];
    if (Teams.isYeni(row)) rozet.push('<span class="rozet r-yeni">İlk kez görev</span>');
    var dilObj = TextParse.parseYabanciDil(row["YabanciDil"]);
    if (dilObj && dilObj.puan !== null) rozet.push('<span class="rozet r-dil">Dil ' + dilObj.puan + "</span>");

    var html = "<h3>" + esc((row["Ad"] || "") + " " + (row["Soyad"] || "")) + "</h3>" +
      '<p class="hint">' + esc(row["Universite"] || "") + " · " + esc(tipEt) +
      (row["AkademikUnvan"] ? " · " + esc(row["AkademikUnvan"]) : "") + "</p>" +
      (rozet.length ? "<p>" + rozet.join(" ") + "</p>" : "");

    // Hangi takım(lar)da asil, hangi tür yedek havuzunda görevli
    var gorevler = [];
    Object.keys(T.takimlar).forEach(function (kurum) {
      var tk = T.takimlar[kurum];
      ["baskan", "akademik", "idari", "ogrenci"].forEach(function (rl) {
        var asil = rl === "akademik" ? tk.asil.akademik : (tk.asil[rl] ? [tk.asil[rl]] : []);
        if (asil.indexOf(tc) !== -1) gorevler.push(esc(kurum) + " — " + Teams.ROL_LABELS[rl] + " (asil)");
      });
    });
    Object.keys(T.yedekHavuzu).forEach(function (turId) {
      ROLLER.forEach(function (rl) {
        if ((T.yedekHavuzu[turId][rl] || []).indexOf(tc) !== -1) {
          gorevler.push(esc(turAdi(turId)) + " — " + Teams.ROL_LABELS[rl] + " yedeği (havuz)");
        }
      });
    });
    if (gorevler.length) {
      html += "<h4>Dönemdeki Görevi</h4><ul>" +
        gorevler.map(function (g) { return "<li>" + g + "</li>"; }).join("") + "</ul>";
    }

    // Değerlendirici özeti
    var tk = TextParse.parseSayi(row["TkBsk"]), ak = TextParse.parseSayi(row["AkdGor"]), ii = TextParse.parseSayi(row["IdrGor"]);
    var dilTxt = "—";
    if (dilObj && dilObj.puan !== null) dilTxt = dilObj.sinav + " " + dilObj.ham + " (100'lük: " + dilObj.puan + ")";
    else if (dilObj && dilObj.puan === null) dilTxt = "Çözümlenemedi";
    var kriterPuan = window.PoolAccess && window.PoolAccess.score ? window.PoolAccess.score(tc) : null;
    var ozet = [
      ["Kriter puanı (seçim)", kriterPuan === null || kriterPuan === undefined ? "—" : kriterPuan + " / 100"],
      ["Tip", tipEt],
      ["Temel Alan", row["Temel Alan"] || "—"],
      ["Bilim Alanı", row["Bilim Alan"] || "—"],
      ["Takım başkanlığı (TkBsk)", tk === null ? "—" : tk],
      ["Akademik değerlendirme (AkdGor)", ak === null ? "—" : ak],
      ["İdari değerlendirme (IdrGor)", ii === null ? "—" : ii],
      ["Toplam görev", Teams.gorevSayisi(row)],
      ["İlk kez görev alacak", Teams.isYeni(row) ? "Evet" : "Hayır"],
      ["Yabancı dil", dilTxt],
      ["Havuz durumu", TextParse.norm(row["Secim"]) === "e" ? "Mevcut havuz (E)" : (TextParse.norm(row["Secim"]) === "y" ? "Yeni başvuru (Y)" : "—")]
    ];
    html += "<h4>Değerlendirici Özeti</h4><table class='detay-tablo'><tbody>" +
      ozet.map(function (p) { return "<tr><th>" + esc(p[0]) + "</th><td>" + esc(p[1]) + "</td></tr>"; }).join("") +
      "</tbody></table>";

    // Ham veri
    html += "<h4>Ham Veri</h4><table class='detay-tablo'><tbody>";
    Engine.COLUMNS.forEach(function (col) {
      var v = row[col.ad];
      if (col.ad === "TcNo") v = maskTc(v);
      html += "<tr><th>" + esc(col.ad) + "</th><td>" + esc(v === null || v === undefined ? "—" : v) + "</td></tr>";
    });
    html += "</tbody></table>";

    $("modal-body").innerHTML = html;
    $("modal").hidden = false;
  }

  // Aktif türün yedek havuzunu ekrana çizer.
  // İlk takım oluşturulmadan görünmez (havuz, kurulmuş takımları besler).
  function renderHavuz() {
    var div = $("yedek-havuzu");
    if (!div) return;
    if (!Object.keys(T.takimlar).length) { div.innerHTML = ""; return; }
    var turId = T.aktifTur, t = template(), hav = havuzOf(turId);
    var roller = ["baskan", "akademik"];
    if (t.idariZorunlu) roller.push("idari");
    if (t.ogrenciZorunlu) roller.push("ogrenci");
    var toplam = roller.reduce(function (n, rol) { return n + (hav[rol] || []).length; }, 0);

    var head = '<div class="team-head"><div><strong>' + esc(turAdi(turId)) + " — Yedek Havuzu</strong>" +
      ' <span class="hint">' + toplam + " kişi</span></div>" +
      '<div class="team-actions">' +
      '<button type="button" class="btn-mini" data-hav-oto>Havuzu oluştur/güncelle</button>' +
      (toplam ? '<button type="button" class="btn-mini" data-hav-temizle>Temizle</button>' : "") +
      "</div></div>";
    var tbl = '<table class="slot-tablo"><tbody>';
    roller.forEach(function (rol) {
      var liste = hav[rol] || [];
      tbl += '<tr><th>' + esc(Teams.ROL_LABELS[rol]) + " yedekleri</th><td>" +
        (liste.length ? liste.map(function (tc) {
          return '<div class="yedek-item">' + uyeChip(tc, rol, "", true, true) +
            '<span class="yedek-btns"><button type="button" class="btn-mini" data-hsil-rol="' + rol +
            '" data-hsil-tc="' + esc(tc) + '">Çıkar</button></span></div>';
        }).join("") : '<span class="hint">—</span>') +
        '</td><td class="slot-btn"><button type="button" class="btn-mini" data-hekle-rol="' + rol + '">Ekle</button></td></tr>';
    });
    tbl += "</tbody></table>";

    var card = document.createElement("div");
    card.className = "team-card havuz-card";
    card.innerHTML = head + tbl +
      '<div class="team-uyari"><span class="hint">Yedek havuzu değerlendirme türüne bağlıdır ve tüm takımlarca ' +
      'paylaşılır. Bir üyeyi "Değiştir" ile çağırdığınızda havuzdan çıkar; yerine geçtiği asil havuza döner.</span></div>';

    card.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) {
        var u = e.target.closest(".uye[data-uye-tc]");
        if (u) showUyeProfil(u.getAttribute("data-uye-tc"));
        return;
      }
      if (b.hasAttribute("data-hav-oto")) {
        if (!pool().length) { bildir("Havuz boş; önce başvuru dosyası yükleyiniz.", "err"); return; }
        var r = autoFillHavuz();
        renderTakimlar();
        bildir(r.eklenen
          ? r.eklenen + " kişi yedek havuzuna eklendi" + (r.eksik.length ? " (" + [...new Set(r.eksik)].join(", ") + " için uygun kalmadı)." : ".")
          : "Eklenecek uygun kişi bulunamadı (havuz zaten dolu ya da uygun aday yok).", r.eklenen ? "ok" : "");
      } else if (b.hasAttribute("data-hav-temizle")) {
        onay(turAdi(turId) + " yedek havuzu temizlenecek. Onaylıyor musunuz?", { tehlike: true, onayEtiket: "Temizle" })
          .then(function (evet) {
            if (!evet) return;
            T.yedekHavuzu[turId] = { baskan: [], akademik: [], idari: [], ogrenci: [] };
            renderTakimlar();
          });
      } else if (b.dataset.hekleRol) {
        if (!pool().length) { bildir("Havuz boş; önce başvuru dosyası yükleyiniz.", "err"); return; }
        openPicker({ mod: "havuz", turId: turId, rol: b.dataset.hekleRol });
      } else if (b.dataset.hsilRol) {
        hav[b.dataset.hsilRol] = hav[b.dataset.hsilRol].filter(function (x) { return x !== b.dataset.hsilTc; });
        renderTakimlar();
      }
    });
    card.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var u = e.target.closest(".uye[data-uye-tc]");
      if (u) { e.preventDefault(); showUyeProfil(u.getAttribute("data-uye-tc")); }
    });

    div.innerHTML = "";
    div.appendChild(card);
  }

  // Kurulan tüm takımların asil kadrosunun analitiğini (Havuz Analitiği ile aynı
  // grafiklerle) çizer; renderTakimlar her değişiklikte çağırdığından güncel kalır.
  function renderTakimAnalitigi() {
    var sec = $("takim-analitigi-section"), body = $("takim-analitigi");
    if (!sec || !body || !window.Charts) return;
    var idx = poolIndex(), tcler = new Set();
    Object.keys(T.takimlar).forEach(function (kurum) {
      Teams.asilTcleri(T.takimlar[kurum]).forEach(function (tc) { tcler.add(tc); });
    });
    var rows = [];
    tcler.forEach(function (tc) { if (idx[tc]) rows.push(idx[tc]); });
    if (!rows.length) { sec.hidden = true; body.innerHTML = ""; return; }
    body.innerHTML = Charts.renderDashboard(rows, { toplamEtiket: "Takımdaki Üye", birim: "üye" });
    sec.hidden = false;
  }

  function renderTakimlar() {
    var div = $("takim-listesi");
    div.innerHTML = "";
    if (!T.seciliKurumlar.length) {
      div.innerHTML = '<p class="hint">Takım kurmak için önce yukarıdan değerlendirilecek kurumları seçiniz.</p>';
      renderHavuzDurum(); renderHavuz(); renderCoiAdaylar(); renderTakimAnalitigi();
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

        var tbl = '<table class="slot-tablo"><tbody>';
        satirlar.forEach(function (sat) {
          var rol = sat[0], etiket = sat[1], tc = sat[2], ai = sat[3];
          tbl += '<tr><th>' + esc(etiket) + "</th><td>" +
            (tc ? uyeChip(tc, rol, kurum, false, true) : '<span class="hint">— boş —</span>') +
            '</td><td class="slot-btn"><div class="slot-btns">' +
            '<button type="button" class="btn-mini" data-slot-rol="' + rol + '" data-slot-ai="' + ai + '">' +
            (tc ? "Değiştir" : "Seç") + "</button>" +
            (tc ? '<button type="button" class="btn-mini btn-kaldir" data-kaldir-rol="' + rol +
              '" data-kaldir-ai="' + ai + '">Kaldır</button>' : "") +
            "</div></td></tr>";
        });
        tbl += "</tbody></table>";
        govde.innerHTML = tbl;
        card.appendChild(govde);

        var uyarilar = Teams.validateTeam(takim, pool(), { coiMap: T.coi, digerTakimTcler: bagliTcler({ haricKurum: kurum }) });
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
        if (!b) {
          // Düğme dışında bir üyeye tıklanırsa profilini göster
          var u = e.target.closest(".uye[data-uye-tc]");
          if (u) showUyeProfil(u.getAttribute("data-uye-tc"));
          return;
        }
        if (b.dataset.act === "oto" || b.dataset.act === "yeniden") {
          if (!pool().length) { bildir("Havuz boş; önce başvuru dosyası yükleyiniz.", "err"); return; }
          var kur = function () {
            var uy = autoBuild(kurum);
            renderTakimlar();
            bildir(uy.length ? kurum + ": takım kuruldu; " + uy.length + " uyarı var." : kurum + ": takım kuruldu.", uy.length ? "" : "ok");
          };
          if (b.dataset.act === "yeniden") {
            onay("\"" + kurum + "\" takımı yeniden kurulacak; mevcut asil kadro silinip rastlantısal olarak yeniden atanacak. Onaylıyor musunuz?",
              { tehlike: true, onayEtiket: "Yeniden kur" }).then(function (evet) { if (evet) kur(); });
          } else {
            kur();
          }
        } else if (b.dataset.act === "bos") {
          T.takimlar[kurum] = Teams.bosTakim(kurum, T.aktifTur, T.donem, template());
          renderTakimlar();
        } else if (b.dataset.act === "sil") {
          onay("\"" + kurum + "\" takımı silinecek. Onaylıyor musunuz?", { tehlike: true, onayEtiket: "Sil" })
            .then(function (evet) {
              if (!evet) return;
              delete T.takimlar[kurum];
              renderTakimlar();
            });
        } else if (b.dataset.slotRol) {
          openPicker({ mod: "asil", kurum: kurum, rol: b.dataset.slotRol, akademikIdx: parseInt(b.dataset.slotAi, 10) });
        } else if (b.dataset.kaldirRol) {
          kaldirUye(kurum, b.dataset.kaldirRol, parseInt(b.dataset.kaldirAi, 10));
        }
      });

      // Klavye erişilebilirliği: üye üzerinde Enter/Space profil açar
      card.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var u = e.target.closest(".uye[data-uye-tc]");
        if (u) { e.preventDefault(); showUyeProfil(u.getAttribute("data-uye-tc")); }
      });

      div.appendChild(card);
    });
    renderHavuzDurum();
    renderHavuz();
    renderCoiAdaylar();
    renderTakimAnalitigi();
  }

  // ---------------- Aday seçim penceresi ----------------
  // opts:
  //   { mod:"asil", kurum, rol, akademikIdx } — takım koltuğunu doldur/değiştir
  //   { mod:"havuz", turId, rol }             — yedek havuzuna kişi ekle
  function openPicker(opts) {
    var mod = opts.mod, rol = opts.rol;
    var idx = poolIndex();
    var gruplar = []; // { etiket, rows, kaynak:"yedek"|"havuz" }
    var elenen = [];
    var baslik, altyazi;

    // Adayları kriter puanına göre azalan sırala (puansızlar sona, ada göre)
    function puanOf(r) {
      return window.PoolAccess && window.PoolAccess.score ? window.PoolAccess.score(Teams.tcOf(r)) : null;
    }
    function puanSirala(rows) {
      return rows.slice().sort(function (a, b) {
        var pa = puanOf(a), pb = puanOf(b);
        if (pa === null && pb === null) {
          return ((a["Ad"] || "") + " " + (a["Soyad"] || "")).localeCompare((b["Ad"] || "") + " " + (b["Soyad"] || ""), "tr");
        }
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pb - pa;
      });
    }

    if (mod === "asil") {
      var kurum = opts.kurum, takim = T.takimlar[kurum], s = takim.sablon, turId = takim.turId;
      var takimKurumlari = [];
      Teams.asilTcleri(takim).forEach(function (tc) { if (idx[tc]) takimKurumlari.push(idx[tc]["Universite"]); });
      var kurumF = s.ayniKurumTek ? takimKurumlari : null;

      // 1) Bu türün yedek havuzundan, bu takıma uygun olanlar
      var yedekRows = (havuzOf(turId)[rol] || []).map(function (tc) { return idx[tc]; }).filter(Boolean);
      var yedekSonuc = Teams.uygunAdaylar(yedekRows, rol, kurum, s, {
        coiMap: T.coi, takimTcler: Teams.takimTcleri(takim), takimKurumlari: kurumF
      });
      if (yedekSonuc.uygun.length) gruplar.push({ etiket: "Yedek havuzundan", rows: puanSirala(yedekSonuc.uygun), kaynak: "yedek" });
      elenen = elenen.concat(yedekSonuc.red.map(function (r) { return { row: r.row, sebep: "Yedek — " + r.sebep }; }));

      // 2) Değerlendirici havuzundan (henüz hiçbir yere bağlı olmayanlar)
      var freshSonuc = Teams.uygunAdaylar(pool(), rol, kurum, s, {
        coiMap: T.coi, atananlar: bagliTcler({ haricKurum: kurum }),
        takimTcler: Teams.takimTcleri(takim), takimKurumlari: kurumF
      });
      gruplar.push({ etiket: "Değerlendirici havuzundan (yeni)", rows: puanSirala(freshSonuc.uygun), kaynak: "havuz" });
      elenen = elenen.concat(freshSonuc.red);

      baslik = esc(kurum);
      altyazi = esc(Teams.ROL_LABELS[rol]) + " — asil üye seçimi. Önce bu türün yedek havuzu, sonra " +
        "değerlendirici havuzu gösterilir; her grup kriter puanına göre (yüksekten düşüğe) sıralanır.";
    } else { // havuz
      var hTurId = opts.turId, tmpl = template();
      var hSonuc = Teams.uygunAdaylar(pool(), rol, "", tmpl, {
        atananlar: bagliTcler(), takimTcler: new Set(havuzOf(hTurId)[rol])
      });
      gruplar.push({ etiket: "Uygun değerlendiriciler", rows: puanSirala(hSonuc.uygun), kaynak: "havuz-ekle" });
      elenen = hSonuc.red;
      baslik = esc(turAdi(hTurId)) + " — Yedek Havuzu";
      altyazi = esc(Teams.ROL_LABELS[rol]) + " yedeği ekleme. Henüz hiçbir takımda ya da havuzda görevli " +
        "olmayan, role uygun değerlendiriciler listelenir.";
    }

    var html = "<h3>" + baslik + "</h3><p class='hint'>" + altyazi + "</p>" +
      '<input type="search" id="picker-arama" placeholder="Ad veya üniversite ara…" class="picker-arama">' +
      '<div id="picker-liste" class="picker-liste"></div>';
    if (elenen.length) {
      html += "<details><summary class='hint'>Elenen adaylar (" + elenen.length + ")</summary><ul class='hint'>" +
        elenen.slice(0, 60).map(function (r) {
          return "<li>" + esc(((r.row["Ad"] || "") + " " + (r.row["Soyad"] || "")).trim()) + " — " + esc(r.sebep) + "</li>";
        }).join("") + (elenen.length > 60 ? "<li>…</li>" : "") + "</ul></details>";
    }
    $("modal-body").innerHTML = html;
    $("modal").hidden = false;

    function sec(tc, kaynak) {
      if (mod === "asil") {
        yerlestirAsil(opts.kurum, opts.rol, opts.akademikIdx, tc, kaynak);
      } else {
        havuzOf(opts.turId)[rol].push(tc);
        renderTakimlar();
        bildir("Değerlendirici yedek havuzuna eklendi.", "ok");
      }
      $("modal").hidden = true;
    }

    function listele() {
      var q = TextParse.norm($("picker-arama").value);
      var kutu = $("picker-liste");
      kutu.innerHTML = "";
      var toplam = 0;
      gruplar.forEach(function (grup) {
        var liste = grup.rows.filter(function (r) {
          if (!q) return true;
          return TextParse.norm((r["Ad"] || "") + " " + (r["Soyad"] || "") + " " + (r["Universite"] || "")).indexOf(q) !== -1;
        });
        if (!liste.length) return;
        toplam += liste.length;
        var bas = document.createElement("div");
        bas.className = "picker-grup";
        bas.textContent = grup.etiket + " (" + liste.length + ")";
        kutu.appendChild(bas);
        liste.forEach(function (r) {
          var tc = Teams.tcOf(r);
          var item = document.createElement("div");
          item.className = "picker-item";
          item.innerHTML = uyeChip(tc, rol, mod === "asil" ? opts.kurum : "", false) +
            '<button type="button" class="btn-mini">' + (mod === "asil" ? "Seç" : "Ekle") + "</button>";
          item.querySelector("button").addEventListener("click", function () { sec(tc, grup.kaynak); });
          kutu.appendChild(item);
        });
      });
      if (!toplam) kutu.innerHTML = '<p class="hint">Uygun aday bulunamadı.</p>';
    }
    $("picker-arama").addEventListener("input", listele);
    listele();
  }

  // Bir takım koltuğuna asil yerleştirir. Değiştirme mantığı (takas):
  // - Seçilen kişi yedek havuzundan geldiyse havuzdan çıkarılır.
  // - Koltuktaki önceki asil (varsa) bu türün yedek havuzuna (aynı rol) alınır.
  function yerlestirAsil(kurum, rol, akademikIdx, tc, kaynak) {
    var tk = T.takimlar[kurum], turId = tk.turId;
    var eski = null;
    if (rol === "baskan") { eski = tk.asil.baskan; tk.asil.baskan = tc; }
    else if (rol === "idari") { eski = tk.asil.idari; tk.asil.idari = tc; }
    else if (rol === "ogrenci") { eski = tk.asil.ogrenci; tk.asil.ogrenci = tc; }
    else {
      if (akademikIdx >= 0 && akademikIdx < tk.asil.akademik.length) { eski = tk.asil.akademik[akademikIdx]; tk.asil.akademik[akademikIdx] = tc; }
      else tk.asil.akademik.push(tc);
    }
    // Seçilen kişi havuzdaysa çıkar (artık asil olarak görevli)
    var hav = havuzOf(turId);
    ROLLER.forEach(function (rl) { hav[rl] = hav[rl].filter(function (x) { return x !== tc; }); });
    // Önceki asil, aynı türün aynı rol yedek havuzuna alınır (takas)
    if (eski && eski !== tc) hav[rol].push(eski);
    renderTakimlar();
    bildir(eski && eski !== tc
      ? (kaynak === "yedek" ? "Yedekten çağrıldı; önceki asil yedek havuzuna alındı." : "Üye değiştirildi; önceki asil yedek havuzuna alındı.")
      : "Üye atandı.", "ok");
  }

  // Bir koltuktaki üyeyi (onay alarak) kaldırır; koltuk boş kalır. Kaldırılan
  // kişi serbest bırakılır (havuza taşınmaz). Boş koltuk, alttaki kontrol
  // ekranında şablona göre eksiklik olarak bildirilir.
  function kaldirUye(kurum, rol, akademikIdx) {
    var tk = T.takimlar[kurum];
    var tc = rol === "akademik" ? tk.asil.akademik[akademikIdx] : tk.asil[rol];
    if (!tc) return;
    var row = poolIndex()[tc];
    var ad = row ? ((row["Ad"] || "") + " " + (row["Soyad"] || "")).trim() : "TcNo " + maskTc(tc);
    onay("\"" + ad + "\" " + Teams.ROL_LABELS[rol] + " koltuğundan kaldırılacak ve koltuk boş kalacak. Onaylıyor musunuz?",
      { tehlike: true, onayEtiket: "Kaldır" }).then(function (evet) {
      if (!evet) return;
      // Kaldırma anında dizideki konum değişmiş olabilir; tc'yi yeniden ara
      if (rol === "akademik") {
        var i = tk.asil.akademik.indexOf(tc);
        if (i !== -1) tk.asil.akademik.splice(i, 1);
      } else if (tk.asil[rol] === tc) {
        tk.asil[rol] = null;
      }
      renderTakimlar();
      bildir("Üye kaldırıldı; koltuk boş bırakıldı. Eksiklik, takım kontrol panelinde bildirilir.", "");
    });
  }

  // ---------------- ÇÇ beyanları ----------------
  function renderCoiAdaylar() {
    var sel = $("coi-aday");
    var onceki = sel.value;
    sel.innerHTML = '<option value="">Değerlendirici seçiniz…</option>';
    pool().map(function (r) {
      var tc = Teams.tcOf(r);
      if (!tc) return null;
      return { tc: tc, ad: ((r["Ad"] || "") + " " + (r["Soyad"] || "")).trim() };
    }).filter(Boolean)
      .sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); })
      .forEach(function (k) {
        var o = document.createElement("option");
        o.value = k.tc;
        o.textContent = k.ad + " (" + maskTc(k.tc) + ")";
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
    var havuzVar = Object.keys(T.yedekHavuzu).some(function (id) {
      return ROLLER.some(function (rol) { return (T.yedekHavuzu[id][rol] || []).length; });
    });
    if (!kurumlar.length && !havuzVar) { bildir("Dışa aktarılacak takım ya da yedek havuzu yok.", "err"); return; }
    var idx = poolIndex();
    var satirlar = [], havuzSatir = [], ozet = [];

    function kisiSatiri(donem, turId, kurum, rol, tc, durum) {
      var r = idx[tc] || {};
      return {
        "Dönem": donem || T.donem, "Değerlendirme Türü": turAdi(turId),
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
      if (tk.asil.baskan) satirlar.push(kisiSatiri(tk.donem, tk.turId, kurum, "baskan", tk.asil.baskan, "Asil"));
      tk.asil.akademik.forEach(function (tc) { if (tc) satirlar.push(kisiSatiri(tk.donem, tk.turId, kurum, "akademik", tc, "Asil")); });
      if (tk.asil.idari) satirlar.push(kisiSatiri(tk.donem, tk.turId, kurum, "idari", tk.asil.idari, "Asil"));
      if (tk.asil.ogrenci) satirlar.push(kisiSatiri(tk.donem, tk.turId, kurum, "ogrenci", tk.asil.ogrenci, "Asil"));
      var uyarilar = Teams.validateTeam(tk, pool(), { coiMap: T.coi, digerTakimTcler: bagliTcler({ haricKurum: kurum }) });
      ozet.push({
        "Kurum": kurum, "Değerlendirme Türü": turAdi(tk.turId), "Dönem": tk.donem || T.donem,
        "Takım Büyüklüğü (şablon)": Teams.takimBuyuklugu(tk.sablon),
        "Durum": uyarilar.length ? "Uyarı var" : "Kurallara uygun",
        "Uyarılar": uyarilar.join(" | ")
      });
    });

    // Yedek havuzları (türe göre)
    Object.keys(T.yedekHavuzu).forEach(function (turId) {
      ROLLER.forEach(function (rol) {
        (T.yedekHavuzu[turId][rol] || []).forEach(function (tc) {
          havuzSatir.push(kisiSatiri(T.donem, turId, "(Yedek Havuzu)", rol, tc, "Yedek (havuz)"));
        });
      });
    });

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ozet.length ? ozet : [{ "Bilgi": "Takım yok" }]), "Özet");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(satirlar.length ? satirlar : [{ "Bilgi": "Takım yok" }]), "Takımlar");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(havuzSatir.length ? havuzSatir : [{ "Bilgi": "Yedek havuzu boş" }]), "Yedek Havuzu");
    var tarih = new Date().toISOString().slice(0, 10);
    var ad = "degerlendirme-takimlari-" + tarih + ".xlsx";
    if (window.indirWorkbook) window.indirWorkbook(wb, ad);
    else XLSX.writeFile(wb, ad);
  }

  function saveWork() {
    var veri = {
      surum: 2, kayitTarihi: new Date().toISOString(),
      donem: T.donem, aktifTur: T.aktifTur, customTurler: T.customTurler,
      sablonlar: T.sablonlar, seciliKurumlar: T.seciliKurumlar,
      ekKurumlar: T.ekKurumlar, takimlar: T.takimlar,
      yedekHavuzu: T.yedekHavuzu, coi: T.coi
    };
    var ad = "takim-calismasi-" + new Date().toISOString().slice(0, 10) + ".json";
    var blob = new Blob([JSON.stringify(veri, null, 2)], { type: "application/octet-stream" });
    if (window.uiDownload) window.uiDownload(blob, ad);
    else { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ad; a.click(); }
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
        if (v.yedekHavuzu && typeof v.yedekHavuzu === "object") T.yedekHavuzu = v.yedekHavuzu;
        else T.yedekHavuzu = {};
        if (v.coi && typeof v.coi === "object") T.coi = v.coi;
        // Eski sürüm (takım bazlı yedek): yedekleri türün yedek havuzuna taşı
        Object.keys(T.takimlar).forEach(function (kurum) {
          var tk = T.takimlar[kurum];
          if (tk && tk.yedek) {
            var hav = havuzOf(tk.turId);
            ROLLER.forEach(function (rol) {
              (tk.yedek[rol] || []).forEach(function (tc) {
                if (hav[rol].indexOf(tc) === -1) hav[rol].push(tc);
              });
            });
            delete tk.yedek;
          }
        });
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
