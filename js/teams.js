/*
 * teams.js — Takım oluşturma mantığı.
 * YÖKAK "Değerlendirici Havuzu ve Değerlendirme Takımlarının Oluşturulması
 * Usul ve Esasları"ndaki kurallar öntanımlı şablon değerleri olarak uygulanır:
 *   - Takımlarda akademik, idari ve öğrenci değerlendirici bulunur (MADDE 8/3)
 *   - Takım başkanı en az 3 kez dış değerlendirici görev almış akademik
 *     değerlendiricidir (MADDE 8/9)
 *   - Her takımda ilk kez görev alacak en az 1, en fazla 2 kişi bulunur (8/8)
 *   - Seçim, kriter şablonu üzerinden rastlantısal yöntemle yapılır (8/5)
 *   - Değerlendirilen kurumla çıkar çatışması/çakışması olamaz (MADDE 9)
 */
(function (root) {
  "use strict";

  var TP = (typeof module !== "undefined" && module.exports)
    ? require("./textparse.js")
    : root.TextParse;

  // ---- Değerlendirme türleri --------------------------------------------
  var DEFAULT_TYPES = [
    { id: "kap",         ad: "KAP — Kurumsal Akreditasyon Programı" },
    { id: "ara",         ad: "KAP — Ara Değerlendirme" },
    { id: "ukap",        ad: "UKAP — Uluslararası Kurumsal Akreditasyon Programı" },
    { id: "ukap-izleme", ad: "UKAP — İzleme" },
    { id: "kddp",        ad: "KDDP — Kurumsal Dış Değerlendirme Programı" },
    { id: "kddp-izleme", ad: "KDDP — İzleme" }
  ];

  // Tür bazında öntanımlı şablonlar; tanımsız türler BASE ile başlar.
  var BASE_TEMPLATE = {
    akademikSayisi: 3,   // başkan hariç akademik üye sayısı
    idariZorunlu: true,  // takımda idari değerlendirici bulunsun mu
    ogrenciZorunlu: true,// takımda öğrenci değerlendirici bulunsun mu
    bskMinGorev: 3,      // başkan için asgari görev sayısı (TkBsk + AkdGor)
    minDilPuani: 0,      // başkan ve akademik üyeler için asgari dil puanı (100'lük; 0 = kapalı)
    minYeni: 1,          // ilk kez görev alacak asgari üye sayısı
    maxYeni: 2,          // ilk kez görev alacak azami üye sayısı
    ayniKurumTek: true,  // aynı üniversiteden en fazla bir üye
    yedekSayisi: 1       // rol başına yedek sayısı
  };

  var TYPE_TEMPLATES = {
    "kap":         {},
    "ara":         { akademikSayisi: 2, ogrenciZorunlu: false, minYeni: 0 },
    "ukap":        { minDilPuani: 80 },
    "ukap-izleme": { akademikSayisi: 2, ogrenciZorunlu: false, minYeni: 0, minDilPuani: 80 },
    "kddp":        {},
    "kddp-izleme": { akademikSayisi: 2, ogrenciZorunlu: false, minYeni: 0 }
  };

  function defaultTemplate(turId) {
    var t = JSON.parse(JSON.stringify(BASE_TEMPLATE));
    var ozel = TYPE_TEMPLATES[turId] || {};
    Object.keys(ozel).forEach(function (k) { t[k] = ozel[k]; });
    return t;
  }

  function takimBuyuklugu(template) {
    return 1 + template.akademikSayisi +
      (template.idariZorunlu ? 1 : 0) + (template.ogrenciZorunlu ? 1 : 0);
  }

  var ROL_LABELS = {
    baskan: "Takım Başkanı",
    akademik: "Akademik Değerlendirici",
    idari: "İdari Değerlendirici",
    ogrenci: "Öğrenci Değerlendirici"
  };

  // ---- Aday nitelikleri --------------------------------------------------
  function tipOf(row) {
    var n = TP.norm(row["Tip"]);
    if (n.indexOf("idari") !== -1) return "idari";
    if (n.indexOf("ogrenci") !== -1) return "ogrenci";
    if (n.indexOf("akademik") !== -1) return "akademik";
    return "diger";
  }

  function gorevSayisi(row) { // dış değerlendirici görev toplamı
    return (TP.parseSayi(row["TkBsk"]) || 0) + (TP.parseSayi(row["AkdGor"]) || 0) +
           (TP.parseSayi(row["IdrGor"]) || 0);
  }

  function isYeni(row) { return gorevSayisi(row) === 0; }

  function dilPuani(row) {
    var d = TP.parseYabanciDil(row["YabanciDil"]);
    return d && d.puan !== null ? d.puan : null;
  }

  function tcOf(row) {
    return String(row["TcNo"] === null || row["TcNo"] === undefined ? "" : row["TcNo"]).trim();
  }

  // ---- Çıkar çatışması/çakışması ----------------------------------------
  // coiMap: { tcNo: [kurum adları] } — elle beyan edilen çatışmalar.
  // Dönen değer: null (sorun yok) veya gerekçe metni.
  function coiSebebi(row, kurum, coiMap) {
    var nk = TP.norm(kurum);
    if (TP.norm(row["Universite"]) === nk) {
      return "Değerlendirilen kurumun mensubu (çıkar çatışması).";
    }
    var liste = (coiMap || {})[tcOf(row)] || [];
    for (var i = 0; i < liste.length; i++) {
      if (TP.norm(liste[i]) === nk) return "Bu kurum için çıkar çatışması beyanı kayıtlı.";
    }
    return null;
  }

  // ---- Rol uygunluğu -----------------------------------------------------
  // Dönen değer: null (uygun) veya red gerekçesi.
  function rolSebebi(row, rol, template) {
    var tip = tipOf(row);
    if (rol === "baskan") {
      if (tip !== "akademik") return "Takım başkanı akademik değerlendirici olmalıdır.";
      if (gorevSayisi(row) < template.bskMinGorev) {
        return "Görev sayısı yetersiz (" + gorevSayisi(row) + " / en az " + template.bskMinGorev + ").";
      }
    } else if (rol === "akademik") {
      if (tip !== "akademik") return "Akademik değerlendirici değil.";
    } else if (rol === "idari") {
      if (tip !== "idari") return "İdari değerlendirici değil.";
    } else if (rol === "ogrenci") {
      if (tip !== "ogrenci") return "Öğrenci değerlendirici değil.";
    }
    if (template.minDilPuani > 0 && (rol === "baskan" || rol === "akademik")) {
      var dil = dilPuani(row);
      if (dil === null) return "Yabancı dil puanı bulunamadı (asgari " + template.minDilPuani + " gerekli).";
      if (dil < template.minDilPuani) {
        return "Yabancı dil puanı yetersiz (" + dil + " / en az " + template.minDilPuani + ").";
      }
    }
    return null;
  }

  // ---- Uygun aday listesi ------------------------------------------------
  // ctx: { coiMap, atananlar:Set(tc — dönemde başka takımlarda asil VEYA yedek görevli),
  //        takimTcler:Set(tc — bu takımda), takimKurumlari:[üniversite adları — ayniKurumTek için] }
  // Bir kişi dönem içinde tek görev alabilir; asil ya da yedek olması fark etmez.
  // Dönen değer: {uygun: [row...], red: [{row, sebep}...]}
  function uygunAdaylar(pool, rol, kurum, template, ctx) {
    ctx = ctx || {};
    var uygun = [], red = [];
    (pool || []).forEach(function (row) {
      var tc = tcOf(row);
      if (!tc) return; // kimliksiz kayıt takıma atanamaz
      var sebep = null;
      if (ctx.takimTcler && ctx.takimTcler.has(tc)) sebep = "Bu takımda zaten görevli.";
      else if (ctx.atananlar && ctx.atananlar.has(tc)) sebep = "Bu dönemde başka bir takımda görevli (asil/yedek); aynı anda tek görev alınabilir.";
      else sebep = coiSebebi(row, kurum, ctx.coiMap) || rolSebebi(row, rol, template);
      if (!sebep && template.ayniKurumTek && ctx.takimKurumlari) {
        var u = TP.norm(row["Universite"]);
        if (u && ctx.takimKurumlari.some(function (k) { return TP.norm(k) === u; })) {
          sebep = "Takımda aynı üniversiteden üye var.";
        }
      }
      if (sebep) red.push({ row: row, sebep: sebep });
      else uygun.push(row);
    });
    return { uygun: uygun, red: red };
  }

  // ---- Rastlantısal seçim -----------------------------------------------
  function shuffle(arr, rng) {
    rng = rng || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Takım nesnesi: { kurum, turId, donem, sablon (anlık kopya),
  //                  asil: {baskan: tc|null, akademik: [tc], idari: tc|null, ogrenci: tc|null},
  //                  yedek: {baskan: [tc], akademik: [tc], idari: [tc], ogrenci: [tc]} }
  // Yedekler artık takım bazında tutulmaz; değerlendirme türüne bağlı ortak
  // yedek havuzunda (bkz. teams-ui.js) toplanır ve "Değiştir" ile çağrılır.
  function bosTakim(kurum, turId, donem, template) {
    return {
      kurum: kurum, turId: turId, donem: donem,
      sablon: JSON.parse(JSON.stringify(template)),
      asil: { baskan: null, akademik: [], idari: null, ogrenci: null }
    };
  }

  function takimTcleri(takim) { return asilTcleri(takim); }

  function asilTcleri(takim) {
    var s = new Set();
    if (takim.asil.baskan) s.add(takim.asil.baskan);
    takim.asil.akademik.forEach(function (tc) { s.add(tc); });
    if (takim.asil.idari) s.add(takim.asil.idari);
    if (takim.asil.ogrenci) s.add(takim.asil.ogrenci);
    return s;
  }

  // Otomatik (rastlantısal) takım kurulumu — yalnızca asil kadro kurulur.
  // opts: { coiMap, atananlar:Set(dönemde görevli/yedek havuzunda bulunan tüm tc'ler), rng }
  // Dönen değer: { takim, uyarilar: [metin] }
  function autoAssign(pool, kurum, turId, donem, template, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    var takim = bosTakim(kurum, turId, donem, template);
    var uyarilar = [];
    var index = {};
    (pool || []).forEach(function (r) { var tc = tcOf(r); if (tc) index[tc] = r; });

    function ctx() {
      var kurumlar = [];
      asilTcleri(takim).forEach(function (tc) {
        if (index[tc]) kurumlar.push(index[tc]["Universite"]);
      });
      return {
        coiMap: opts.coiMap,
        atananlar: opts.atananlar,
        takimTcler: takimTcleri(takim),
        takimKurumlari: kurumlar
      };
    }

    function sec(rol, filtre) {
      var u = uygunAdaylar(pool, rol, kurum, template, ctx()).uygun;
      if (filtre) u = u.filter(filtre);
      var karisik = shuffle(u, rng);
      return karisik.length ? karisik[0] : null;
    }

    // Başkan
    var bsk = sec("baskan");
    if (bsk) takim.asil.baskan = tcOf(bsk);
    else uyarilar.push("Takım başkanı için uygun aday bulunamadı.");

    // Akademik üyeler: önce ilk kez görev alacaklardan minYeni kadar
    var yeniHedef = Math.min(template.minYeni, template.akademikSayisi);
    var yeniSayisi = 0;
    for (var i = 0; i < template.akademikSayisi; i++) {
      var aday = null;
      if (yeniSayisi < yeniHedef) {
        aday = sec("akademik", isYeni);
        if (aday) yeniSayisi++;
      }
      if (!aday) {
        // maxYeni aşılmasın: kalan koltuklar için önce deneyimlilerden dene
        aday = sec("akademik", function (r) { return !isYeni(r); }) ||
               (yeniSayisi < template.maxYeni ? sec("akademik", isYeni) : null);
        if (aday && isYeni(aday)) yeniSayisi++;
      }
      if (aday) takim.asil.akademik.push(tcOf(aday));
      else { uyarilar.push("Akademik üye için uygun aday kalmadı (" + (i + 1) + ". koltuk)."); break; }
    }

    // İdari / Öğrenci — yeni üst sınırı aşılacaksa önce deneyimli idari denenir
    if (template.idariZorunlu) {
      var idr = (yeniSayisi >= template.maxYeni ? sec("idari", function (r) { return !isYeni(r); }) : null) ||
                sec("idari");
      if (idr) { takim.asil.idari = tcOf(idr); if (isYeni(idr)) yeniSayisi++; }
      else uyarilar.push("İdari değerlendirici için uygun aday bulunamadı.");
    }
    if (template.ogrenciZorunlu) {
      var ogr = sec("ogrenci");
      if (ogr) takim.asil.ogrenci = tcOf(ogr);
      else uyarilar.push("Öğrenci değerlendirici için uygun aday bulunamadı.");
    }

    return { takim: takim, uyarilar: uyarilar };
  }

  // ---- Takım doğrulama ---------------------------------------------------
  // Dönen değer: uyarı metinleri listesi (boş = kurallara uygun).
  function validateTeam(takim, pool, opts) {
    opts = opts || {};
    var t = takim.sablon, uyarilar = [];
    var index = {};
    (pool || []).forEach(function (r) { var tc = tcOf(r); if (tc) index[tc] = r; });

    function rowOf(tc) { return index[tc] || null; }

    // Boş koltuklar
    if (!takim.asil.baskan) uyarilar.push("Takım başkanı atanmadı.");
    if (takim.asil.akademik.length < t.akademikSayisi) {
      uyarilar.push("Akademik üye eksik (" + takim.asil.akademik.length + " / " + t.akademikSayisi + ").");
    }
    if (t.idariZorunlu && !takim.asil.idari) uyarilar.push("İdari değerlendirici atanmadı.");
    if (t.ogrenciZorunlu && !takim.asil.ogrenci) uyarilar.push("Öğrenci değerlendirici atanmadı.");

    // Üye bazlı kontroller
    var roller = [["baskan", takim.asil.baskan ? [takim.asil.baskan] : []],
                  ["akademik", takim.asil.akademik],
                  ["idari", takim.asil.idari ? [takim.asil.idari] : []],
                  ["ogrenci", takim.asil.ogrenci ? [takim.asil.ogrenci] : []]];
    var yeniSayisi = 0, kurumSayaci = {};
    roller.forEach(function (pair) {
      var rol = pair[0];
      pair[1].forEach(function (tc) {
        var row = rowOf(tc);
        if (!row) { uyarilar.push(adEtiketi(null, tc) + ": havuz verisinde bulunamadı (dosya değişmiş olabilir)."); return; }
        var coi = coiSebebi(row, takim.kurum, opts.coiMap);
        if (coi) uyarilar.push(adEtiketi(row, tc) + ": " + coi);
        var rs = rolSebebi(row, rol, t);
        if (rs) uyarilar.push(adEtiketi(row, tc) + " (" + ROL_LABELS[rol] + "): " + rs);
        if (opts.digerTakimTcler && opts.digerTakimTcler.has(tc)) {
          uyarilar.push(adEtiketi(row, tc) + ": bu dönemde başka bir takımda görevli (aynı anda tek görev alınabilir).");
        }
        // Öğrenci değerlendiriciler "ilk kez görev" sayımına dahil edilmez
        if (rol !== "ogrenci" && isYeni(row)) yeniSayisi++;
        var u = TP.norm(row["Universite"]);
        if (u) kurumSayaci[u] = (kurumSayaci[u] || 0) + 1;
      });
    });

    // Aynı kişi bu takımda birden fazla koltukta yer alamaz
    var sayim = {};
    [takim.asil.baskan, takim.asil.idari, takim.asil.ogrenci]
      .concat(takim.asil.akademik)
      .forEach(function (tc) { if (tc) sayim[tc] = (sayim[tc] || 0) + 1; });
    Object.keys(sayim).forEach(function (tc) {
      if (sayim[tc] > 1) {
        uyarilar.push(adEtiketi(rowOf(tc), tc) + ": aynı takımda birden fazla koltukta yer alıyor (aynı anda tek görev).");
      }
    });

    if (t.minYeni > 0 && yeniSayisi < t.minYeni) {
      uyarilar.push("İlk kez görev alacak üye sayısı yetersiz (" + yeniSayisi + " / en az " + t.minYeni + ").");
    }
    if (yeniSayisi > t.maxYeni) {
      uyarilar.push("İlk kez görev alacak üye sayısı fazla (" + yeniSayisi + " / en fazla " + t.maxYeni + ").");
    }
    if (t.ayniKurumTek) {
      Object.keys(kurumSayaci).forEach(function (u) {
        if (kurumSayaci[u] > 1) uyarilar.push("Aynı üniversiteden birden fazla üye var: " + u + ".");
      });
    }
    return uyarilar;
  }

  function adEtiketi(row, tc) {
    if (!row) return "TcNo " + tc;
    return ((row["Ad"] || "") + " " + (row["Soyad"] || "")).trim() || ("TcNo " + tc);
  }

  var api = {
    DEFAULT_TYPES: DEFAULT_TYPES,
    ROL_LABELS: ROL_LABELS,
    defaultTemplate: defaultTemplate,
    takimBuyuklugu: takimBuyuklugu,
    tipOf: tipOf,
    gorevSayisi: gorevSayisi,
    isYeni: isYeni,
    dilPuani: dilPuani,
    tcOf: tcOf,
    coiSebebi: coiSebebi,
    rolSebebi: rolSebebi,
    uygunAdaylar: uygunAdaylar,
    shuffle: shuffle,
    bosTakim: bosTakim,
    takimTcleri: takimTcleri,
    asilTcleri: asilTcleri,
    autoAssign: autoAssign,
    validateTeam: validateTeam
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Teams = api;
})(typeof self !== "undefined" ? self : this);
