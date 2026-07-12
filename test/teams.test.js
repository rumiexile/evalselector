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
check("oto: yedekler ayrıldı", t.yedek.baskan.length >= 0 && t.yedek.akademik.length >= 1, t.yedek);
check("oto: asil ile yedek çakışmaz",
  ["baskan","akademik","idari","ogrenci"].every(rol => t.yedek[rol].every(tc => uyeler.indexOf(tc) === -1)));
const dogrulama = Teams.validateTeam(t, havuz, {});
check("oto: kurulan takım kurallara uygun", dogrulama.length === 0, dogrulama);

// Yeni üye kuralı: takımda 1-2 ilk kez görev alacak üye (öğrenci sayım dışı)
const yeniler = [t.asil.baskan].concat(t.asil.akademik, [t.asil.idari])
  .filter(tc => tc && Teams.isYeni(havuz.find(r => r["TcNo"] === tc)));
check("oto: yeni üye aralığı", yeniler.length >= 1 && yeniler.length <= 2, yeniler);

// Dönem genelinde tekrarlama: ilk takımın asilleri ikinci takımda kullanılmaz
const atananlar = Teams.asilTcleri(t);
const oto2 = Teams.autoAssign(havuz, "Y Üniversitesi", "kap", "2026-1", kap, { rng, atananlar });
const uyeler2 = [oto2.takim.asil.baskan].concat(oto2.takim.asil.akademik,
  [oto2.takim.asil.idari, oto2.takim.asil.ogrenci]).filter(Boolean);
check("oto: dönemde çifte asil görev yok", uyeler2.every(tc => !atananlar.has(tc)), uyeler2);
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

// Çapraz takım kontrolü: başka takımda asil olan üye uyarı üretir
const capraz = Teams.bosTakim("X Üniversitesi", "kap", "2026-1", kap);
capraz.asil.baskan = "1";
const v3 = Teams.validateTeam(capraz, havuz, { digerAsiller: new Set(["1"]) });
check("doğrulama: çifte asil görev uyarısı", v3.some(x => x.indexOf("başka bir takımda") !== -1), v3);

// maxYeni kontrolü
const cokYeni = Teams.bosTakim("X Üniversitesi", "kap", "2026-1", kap);
cokYeni.asil.baskan = "1";
cokYeni.asil.akademik = ["4", "5", "3"];
cokYeni.asil.idari = "7"; cokYeni.asil.ogrenci = "8"; // 4, 5, 7 yeni (öğrenci 8 sayım dışı) → 3 yeni üye
const v2 = Teams.validateTeam(cokYeni, havuz, {});
check("doğrulama: maxYeni aşımı", v2.some(x => x.indexOf("fazla") !== -1), v2);

console.log("\nSonuç: " + passed + " başarılı, " + failed + " başarısız.");
process.exit(failed ? 1 : 0);
