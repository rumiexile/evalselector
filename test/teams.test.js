/*
 * teams.test.js — Takım oluşturma mantığı birim testleri.
 * Çalıştırma: node test/teams.test.js
 */
"use strict";

const Teams = require("../js/teams.js");

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; }
  else { failed++; console.error("BAŞARISIZ: " + name + (extra !== undefined ? " — " + JSON.stringify(extra) : "")); }
}

// Deterministik sözde-rastgele üreteç (testler tekrarlanabilir olsun)
function rngYap(tohum) {
  let s = tohum;
  return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}

function aday(tc, ad, uni, tip, tk, akd, idr, dil, secim) {
  return {
    "TcNo": tc, "Ad": ad, "Soyad": "Test", "Universite": uni, "Tip": tip,
    "TkBsk": tk, "AkdGor": akd, "IdrGor": idr, "YabanciDil": dil,
    "AkademikUnvan": tip === "Akademik" ? "Prof. Dr." : "",
    "Secim": secim || "E", "Temel Alan": "Mühendislik"
  };
}

// Havuz: 5 akademik (2'si başkanlık kriterini sağlar), 2 idari, 2 öğrenci, 2 yeni
const havuz = [
  aday("1", "Bşk-A", "A Üniversitesi", "Akademik", 3, 4, 0, "YDS 90"),
  aday("2", "Bşk-B", "B Üniversitesi", "Akademik", 2, 2, 0, "YDS 85"),
  aday("3", "Akd-C", "C Üniversitesi", "Akademik", 0, 1, 0, "YDS 82"),
  aday("4", "Yeni-D", "D Üniversitesi", "Akademik", 0, 0, 0, "YDS 88"),
  aday("5", "Yeni-E", "E Üniversitesi", "Akademik", 0, 0, 0, "YDS 60"),
  aday("6", "İdr-F", "F Üniversitesi", "İdari", 0, 0, 2, ""),
  aday("7", "İdr-G", "G Üniversitesi", "İdari", 0, 0, 0, ""),
  aday("8", "Öğr-H", "H Üniversitesi", "Öğrenci", 0, 0, 0, ""),
  aday("9", "Öğr-I", "I Üniversitesi", "Öğrenci", 0, 0, 0, "")
];

// ---- Nitelik tespitleri ----
check("tip: akademik", Teams.tipOf(havuz[0]) === "akademik");
check("tip: idari", Teams.tipOf(havuz[5]) === "idari");
check("tip: öğrenci", Teams.tipOf(havuz[7]) === "ogrenci");
check("görev sayısı", Teams.gorevSayisi(havuz[0]) === 7);
check("yeni tespiti", Teams.isYeni(havuz[3]) && !Teams.isYeni(havuz[0]));
check("dil puanı", Teams.dilPuani(havuz[0]) === 90 && Teams.dilPuani(havuz[5]) === null);

// ---- Şablonlar ----
const kap = Teams.defaultTemplate("kap");
check("şablon: KAP öğrenci zorunlu", kap.ogrenciZorunlu === true && kap.idariZorunlu === true);
check("şablon: KAP başkan görev kriteri", kap.bskMinGorev === 3);
check("şablon: UKAP dil şartı", Teams.defaultTemplate("ukap").minDilPuani === 80);
check("şablon: Ara Değerlendirme küçük takım", Teams.defaultTemplate("ara").akademikSayisi === 2);
check("tür: Ara Değerlendirme etiketi KAP çatısında",
  Teams.DEFAULT_TYPES.find(t => t.id === "ara").ad === "KAP — Ara Değerlendirme");
check("şablon: KDDP İzleme türü tanımlı", Teams.DEFAULT_TYPES.some(t => t.id === "kddp-izleme"));
check("tür: izleme etiketleri çizgili biçimde",
  Teams.DEFAULT_TYPES.find(t => t.id === "ukap-izleme").ad === "UKAP — İzleme" &&
  Teams.DEFAULT_TYPES.find(t => t.id === "kddp-izleme").ad === "KDDP — İzleme");
const kddpIzleme = Teams.defaultTemplate("kddp-izleme");
check("şablon: KDDP İzleme izleme yapısında, dil şartı yok",
  kddpIzleme.akademikSayisi === 2 && kddpIzleme.ogrenciZorunlu === false &&
  kddpIzleme.minYeni === 0 && kddpIzleme.minDilPuani === 0);
check("şablon: bilinmeyen tür taban değerlerle", Teams.defaultTemplate("yeni-tur").akademikSayisi === 3);
check("takım büyüklüğü", Teams.takimBuyuklugu(kap) === 6);

// ---- Çıkar çatışması ----
check("ÇÇ: kendi kurumu", Teams.coiSebebi(havuz[0], "A Üniversitesi", {}) !== null);
check("ÇÇ: normalize eşleşme", Teams.coiSebebi(havuz[0], "a üniversitesi", {}) !== null);
check("ÇÇ: farklı kurum", Teams.coiSebebi(havuz[0], "X Üniversitesi", {}) === null);
check("ÇÇ: elle beyan", Teams.coiSebebi(havuz[0], "X Üniversitesi", { "1": ["X Üniversitesi"] }) !== null);

// ---- Rol uygunluğu ----
check("rol: başkan görev şartı", Teams.rolSebebi(havuz[2], "baskan", kap) !== null);
check("rol: başkan uygun", Teams.rolSebebi(havuz[0], "baskan", kap) === null);
check("rol: idari akademik olamaz", Teams.rolSebebi(havuz[5], "akademik", kap) !== null);
check("rol: öğrenci koltuğu", Teams.rolSebebi(havuz[7], "ogrenci", kap) === null);
const ukap = Teams.defaultTemplate("ukap");
check("rol: UKAP dil eler", Teams.rolSebebi(havuz[4], "akademik", ukap) !== null); // YDS 60 < 80
check("rol: UKAP dil geçer", Teams.rolSebebi(havuz[3], "akademik", ukap) === null); // YDS 88
check("rol: UKAP dilsiz idariyi etkilemez", Teams.rolSebebi(havuz[5], "idari", ukap) === null);

// ---- Uygun aday filtresi ----
const u1 = Teams.uygunAdaylar(havuz, "baskan", "A Üniversitesi", kap, {});
check("uygun: kendi kurumu elenir", u1.uygun.every(r => r["TcNo"] !== "1"), u1.uygun.map(r => r["TcNo"]));
check("uygun: gerekçeli red listesi", u1.red.some(r => r.sebep.indexOf("çıkar çatışması") !== -1));
const u2 = Teams.uygunAdaylar(havuz, "akademik", "X Üniversitesi", kap,
  { atananlar: new Set(["3"]), takimTcler: new Set(["4"]) });
check("uygun: dönem ataması elenir", u2.uygun.every(r => r["TcNo"] !== "3"));
check("uygun: takım içi mükerrer elenir", u2.uygun.every(r => r["TcNo"] !== "4"));
const u3 = Teams.uygunAdaylar(havuz, "akademik", "X Üniversitesi", kap,
  { takimKurumlari: ["C Üniversitesi"] });
check("uygun: aynı kurum kuralı", u3.uygun.every(r => r["Universite"] !== "C Üniversitesi"));

// ---- Otomatik kurulum ----
const rng = rngYap(42);
const oto = Teams.autoAssign(havuz, "X Üniversitesi", "kap", "2026-1", kap, { rng });
const t = oto.takim;
check("oto: başkan atandı", t.asil.baskan === "1" || t.asil.baskan === "2", t.asil);
check("oto: akademik koltuklar dolu", t.asil.akademik.length === 3, t.asil.akademik);
check("oto: idari + öğrenci atandı", !!t.asil.idari && !!t.asil.ogrenci);
const uyeler = [t.asil.baskan].concat(t.asil.akademik, [t.asil.idari, t.asil.ogrenci]);
check("oto: mükerrer üye yok", new Set(uyeler).size === uyeler.length, uyeler);
check("oto: takımda yedek üretilmez (havuz modeli)", t.yedek === undefined);
const dogrulama = Teams.validateTeam(t, havuz, {});
check("oto: kurulan takım kurallara uygun", dogrulama.length === 0, dogrulama);

// Yeni üye kuralı: takımda 1-2 ilk kez görev alacak üye (öğrenci sayım dışı)
const yeniler = [t.asil.baskan].concat(t.asil.akademik, [t.asil.idari])
  .filter(tc => tc && Teams.isYeni(havuz.find(r => r["TcNo"] === tc)));
check("oto: yeni üye aralığı", yeniler.length >= 1 && yeniler.length <= 2, yeniler);

// Dönem içinde tek görev: ilk takımın asilleri başka takımda kullanılamaz.
const atananlar = Teams.asilTcleri(t);
const uygunY = Teams.uygunAdaylar(havuz, "akademik", "Y Üniversitesi", kap, { atananlar: atananlar });
check("uygun: başka takımın asili dışlanır",
  uygunY.uygun.every(r => !atananlar.has(Teams.tcOf(r))), uygunY.uygun.map(r => r["TcNo"]));
const oto2 = Teams.autoAssign(havuz, "Y Üniversitesi", "kap", "2026-1", kap, { rng, atananlar });
const tum2 = [...Teams.asilTcleri(oto2.takim)];
check("oto: dönemde çifte görev yok", tum2.every(tc => !atananlar.has(tc)), tum2);
check("oto: yetersiz havuz uyarı üretir", oto2.uyarilar.length > 0, oto2.uyarilar);

// ---- Doğrulama uyarıları ----
const bozuk = Teams.bosTakim("A Üniversitesi", "kap", "2026-1", kap);
bozuk.asil.baskan = "1"; // A Üniversitesi mensubu → ÇÇ
bozuk.asil.akademik = ["4", "5"]; // 2 yeni üye + eksik koltuk
const v = Teams.validateTeam(bozuk, havuz, {});
check("doğrulama: ÇÇ yakalanır", v.some(x => x.indexOf("çıkar çatışması") !== -1), v);
check("doğrulama: eksik koltuk", v.some(x => x.indexOf("Akademik üye eksik") !== -1));
check("doğrulama: idari/öğrenci eksik", v.some(x => x.indexOf("İdari") !== -1) && v.some(x => x.indexOf("Öğrenci") !== -1));
check("doğrulama: havuzda olmayan tc", Teams.validateTeam(
  Object.assign(Teams.bosTakim("X", "kap", "d", kap), { asil: { baskan: "999", akademik: [], idari: null, ogrenci: null } }),
  havuz, {}).some(x => x.indexOf("bulunamadı") !== -1));

// Çapraz takım kontrolü: başka takımda görevli asil üye uyarı üretir
const capraz = Teams.bosTakim("X Üniversitesi", "kap", "2026-1", kap);
capraz.asil.baskan = "1";
const v3 = Teams.validateTeam(capraz, havuz, { digerTakimTcler: new Set(["1"]) });
check("doğrulama: çifte görev uyarısı (asil)", v3.some(x => x.indexOf("başka bir takımda") !== -1), v3);

// Takımda yedek alanı bulunmaz (yedekler artık tür yedek havuzunda)
check("model: bosTakim yedek içermez", Teams.bosTakim("Q", "kap", "d", kap).yedek === undefined);

// Aynı kişi aynı takımda birden fazla koltukta olamaz (asil koltukları)
const dup = Teams.bosTakim("Z Üniversitesi", "kap", "2026-1", kap);
dup.asil.baskan = "1"; dup.asil.akademik = ["1", "4", "5"];
const vD = Teams.validateTeam(dup, havuz, {});
check("doğrulama: takım içi mükerrer koltuk", vD.some(x => x.indexOf("birden fazla koltukta") !== -1), vD);

// maxYeni kontrolü
const cokYeni = Teams.bosTakim("X Üniversitesi", "kap", "2026-1", kap);
cokYeni.asil.baskan = "1";
cokYeni.asil.akademik = ["4", "5", "3"];
cokYeni.asil.idari = "7"; cokYeni.asil.ogrenci = "8"; // 4, 5, 7 yeni (öğrenci 8 sayım dışı) → 3 yeni üye
const v2 = Teams.validateTeam(cokYeni, havuz, {});
check("doğrulama: maxYeni aşımı", v2.some(x => x.indexOf("fazla") !== -1), v2);

// ---- Yeni kriterler ----

// 1) Başkan Prof. Dr. olmalı
const docBaskan = { "TcNo": "d1", "Ad": "X", "Soyad": "Y", "Universite": "Z Üni", "Tip": "Akademik",
  "AkademikUnvan": "Doç. Dr.", "TkBsk": 5, "AkdGor": 5, "IdrGor": 0 };
check("başkan: Prof değilse reddedilir", Teams.rolSebebi(docBaskan, "baskan", kap) !== null &&
  Teams.rolSebebi(docBaskan, "baskan", kap).indexOf("Prof") !== -1);
const noProf = Teams.cloneTemplate ? null : Object.assign(JSON.parse(JSON.stringify(kap)), { baskanProf: false });
check("başkan: Prof şartı kapatılabilir", Teams.rolSebebi(docBaskan, "baskan", noProf) === null);

// 2) Başkan en tecrübeli — yalnızca akademik üyeler (ekKisitlar / uygunAdaylar ctx üzerinden)
const uyeAdayGorevli = aday("m1", "Üye", "M Üni", "Akademik", 3, 3, 0, "YDS 80"); // görev 6
const uyeSonuc = Teams.uygunAdaylar([uyeAdayGorevli], "akademik", "X Üni", kap, { baskanGorevUst: 5 });
check("tecrübe: akademik üye başkandan tecrübeli olamaz", uyeSonuc.uygun.length === 0 &&
  uyeSonuc.red[0].sebep.indexOf("başkandan daha tecrübeli") !== -1);
// İdari üye tecrübe kısıtından muaf (kural yalnızca akademik üyeleri kapsar)
const idariGorevli = { "TcNo": "ig", "Ad": "İd", "Soyad": "Ar", "Universite": "M Üni", "Tip": "İdari", "TkBsk": 4, "AkdGor": 4, "IdrGor": 0 }; // görev 8
const idariSonuc = Teams.uygunAdaylar([idariGorevli], "idari", "X Üni", kap, { baskanGorevUst: 5 });
check("tecrübe: idari üye başkandan tecrübeli olabilir", idariSonuc.uygun.length === 1);
const bskAday = aday("b1", "Bşk", "N Üni", "Akademik", 2, 1, 0, "YDS 80"); // görev 3
const bskSonuc = Teams.uygunAdaylar([bskAday], "baskan", "X Üni", kap, { uyeGorevAlt: 5 });
check("tecrübe: başkan akademik üyelerden az tecrübeli olamaz", bskSonuc.uygun.length === 0 &&
  bskSonuc.red[0].sebep.indexOf("daha tecrübeli olmalı") !== -1);

// 3) Vakıf idari yalnızca devlet kurumlarına (aday ve hedef FARKLI kurumlar)
function uniTurOf(ad) { return (ad === "V1 Üni" || ad === "V2 Üni") ? "Vakıf" : "Devlet"; }
const vakifIdari = { "TcNo": "vi", "Ad": "İd", "Soyad": "Ar", "Universite": "V1 Üni", "Tip": "İdari", "TkBsk": 0, "AkdGor": 0, "IdrGor": 2 };
const viVakif = Teams.uygunAdaylar([vakifIdari], "idari", "V2 Üni", kap, { uniTurOf: uniTurOf, kurumTur: "Vakıf" });
check("vakıf idari: başka vakıf kuruma atanamaz", viVakif.uygun.length === 0 &&
  viVakif.red[0].sebep.indexOf("yalnızca devlet") !== -1);
const viDevlet = Teams.uygunAdaylar([vakifIdari], "idari", "D Üni", kap, { uniTurOf: uniTurOf, kurumTur: "Devlet" });
check("vakıf idari: devlet kuruma atanabilir", viDevlet.uygun.length === 1);
// Devlet idari her yere gidebilir
const devletIdari = { "TcNo": "di", "Ad": "İd2", "Soyad": "Ar", "Universite": "D2 Üni", "Tip": "İdari", "TkBsk": 0, "AkdGor": 0, "IdrGor": 2 };
check("devlet idari: vakıf kuruma atanabilir",
  Teams.uygunAdaylar([devletIdari], "idari", "V2 Üni", kap, { uniTurOf: uniTurOf, kurumTur: "Vakıf" }).uygun.length === 1);

// autoAssign: başkan akademik üyelerden daha tecrübeli (idari/öğrenci kapsam dışı)
const rng2 = rngYap(7);
const otoB = Teams.autoAssign(havuz, "X Üniversitesi", "kap", "2026-1", kap, { rng: rng2 });
const tB = otoB.takim;
if (tB.asil.baskan) {
  const bg = Teams.gorevSayisi(havuz.find(r => r["TcNo"] === tB.asil.baskan));
  const akademikGorevler = tB.asil.akademik
    .filter(Boolean).map(tc => Teams.gorevSayisi(havuz.find(r => r["TcNo"] === tc)));
  check("oto: başkan akademik üyelerden en tecrübeli", akademikGorevler.every(g => bg > g), { bg, akademikGorevler });
} else check("oto: başkan akademik üyelerden en tecrübeli", true);

// validateTeam: başkan akademik üyeden tecrübesizse uyarı
const zayifBaskan = Teams.bosTakim("X Üni", "kap", "d", kap);
zayifBaskan.asil.baskan = "3"; // görev 1
zayifBaskan.asil.akademik = ["1"]; // görev 7
const vZ = Teams.validateTeam(zayifBaskan, havuz, {});
check("doğrulama: başkan akademik tecrübe uyarısı", vZ.some(x => x.indexOf("daha tecrübeli olmalı") !== -1), vZ);

// validateTeam: idari üye başkandan tecrübeli olsa da tecrübe uyarısı verilmez
const superIdari = { "TcNo": "10", "Ad": "Süper", "Soyad": "İdari", "Universite": "J Üniversitesi",
  "Tip": "İdari", "TkBsk": 5, "AkdGor": 5, "IdrGor": 5, "YabanciDil": "", "Secim": "E" }; // görev 15
const havuzIdari = havuz.concat([superIdari]);
const idariTecrubeli = Teams.bosTakim("X Üni", "kap", "d", kap);
idariTecrubeli.asil.baskan = "1"; // görev 7 (akademik)
idariTecrubeli.asil.akademik = ["3"]; // görev 1 (akademik, başkandan az)
idariTecrubeli.asil.idari = "10"; // idari görev 15 — kapsam dışı, uyarı vermemeli
const vI = Teams.validateTeam(idariTecrubeli, havuzIdari, {});
check("doğrulama: idari tecrübe uyarısı vermez", !vI.some(x => x.indexOf("daha tecrübeli olmalı") !== -1), vI);

// validateTeam: cinsiyet dengesi uyarısı (gerçek adlarla)
const cinsHavuz = [
  aday("c1", "Ahmet", "P1", "Akademik", 5, 5, 0, "YDS 90"),
  aday("c2", "Mehmet", "P2", "Akademik", 1, 1, 0, "YDS 80"),
  aday("c3", "Mustafa", "P3", "Akademik", 0, 1, 0, "YDS 80"),
  aday("c4", "Ali", "P4", "İdari", 0, 0, 1, "")
];
const cinsTakim = Teams.bosTakim("X Üni", "kap", "d", kap);
cinsTakim.asil.baskan = "c1"; cinsTakim.asil.akademik = ["c2", "c3"]; cinsTakim.asil.idari = "c4";
const vC = Teams.validateTeam(cinsTakim, cinsHavuz, {});
check("doğrulama: cinsiyet dengesi uyarısı (hepsi erkek)", vC.some(x => x.indexOf("Cinsiyet dengesi") !== -1), vC);

console.log("\nSonuç: " + passed + " başarılı, " + failed + " başarısız.");
process.exit(failed ? 1 : 0);
