/*
 * engine.test.js — Ayrıştırma ve puanlama motoru birim testleri.
 * Çalıştırma: node test/engine.test.js
 */
"use strict";

const TP = require("../js/textparse.js");
const Engine = require("../js/engine.js");
const Criteria = require("../js/criteria.js");

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; }
  else { failed++; console.error("BAŞARISIZ: " + name + (extra !== undefined ? " — " + JSON.stringify(extra) : "")); }
}

// ---- textparse: unvan ----
check("unvan: Prof. Dr.", TP.parseUnvan("Prof. Dr.").seviye === 1);
check("unvan: PROFESÖR", TP.parseUnvan("PROFESÖR").seviye === 1);
check("unvan: Doç. Dr.", TP.parseUnvan("Doç. Dr.").seviye === 2);
check("unvan: Dr. Öğr. Üyesi", TP.parseUnvan("Dr. Öğr. Üyesi").seviye === 3);
check("unvan: Yrd. Doç.", TP.parseUnvan("Yrd. Doç. Dr.").seviye === 3);
check("unvan: Öğr. Gör.", TP.parseUnvan("Öğr. Gör.").seviye === 4);
check("unvan: Araştırma Görevlisi", TP.parseUnvan("Araştırma Görevlisi").seviye === 5);
check("unvan: boş", TP.parseUnvan("") === null);
check("unvan: tanınmayan", TP.parseUnvan("Uzman") === null);

// ---- textparse: görev ----
check("görev: Rektör", TP.parseGorev("Rektör").sira === 1);
check("görev: Rektör Yardımcısı", TP.parseGorev("Rektör Yardımcısı").sira === 2);
check("görev: Dekan", TP.parseGorev("Dekan").sira === 4);
check("görev: Dekan Yardımcısı", TP.parseGorev("Dekan Yardımcısı").sira === 5);
check("görev: Bölüm Başkanı", TP.parseGorev("Bölüm Başkanı").sira === 11);
check("görev: Bölüm Başkan Yardımcısı", TP.parseGorev("Bölüm Başkan Yardımcısı").sira === 12);
check("görev: Anabilim Dalı Başkanı", TP.parseGorev("Anabilim Dalı Başkanı").sira === 13);
check("görev: Enstitü Müdürü", TP.parseGorev("Enstitü Müdürü").sira === 7);
check("görev: Enstitü Müdür Yardımcısı", TP.parseGorev("Enstitü Müdür Yardımcısı").sira === 8);
check("görev: MYO Müdürü", TP.parseGorev("MYO Müdürü").sira === 9);
check("görev: Erasmus Koordinatörü", TP.parseGorev("Erasmus Koordinatörü").sira === 21);
check("görev: ÖYP Koordinatörü", TP.parseGorev("ÖYP Koordinatörü").sira === 24);
check("görev: tanınmayan", TP.parseGorev("Laboratuvar Sorumlusu").sira === null);
check("görev: boş", TP.parseGorev("") === null);

// ---- textparse: yabancı dil ----
check("dil: YDS 92,5", TP.parseYabanciDil("YDS 92,5").puan === 92.5);
check("dil: YÖKDİL", TP.parseYabanciDil("YÖKDİL: 81 (2019)").puan === 81);
check("dil: TOEFL ölçekleme", TP.parseYabanciDil("TOEFL iBT 84").puan === 70);
check("dil: IELTS ölçekleme", Math.abs(TP.parseYabanciDil("IELTS 7,5").puan - 83.3) < 0.05);
check("dil: en yüksek seçilir", TP.parseYabanciDil("YDS 70, KPDS 85").puan === 85);
check("dil: çözümlenemeyen", TP.parseYabanciDil("İngilizce biliyorum").puan === null);
check("dil: boş", TP.parseYabanciDil("") === null);
check("dil: aralık dışı elenir", TP.parseYabanciDil("YDS 250").puan === null);

// ---- textparse: öğrenim ----
const YIL = 2026;
check("öğrenim: doktora yılı", TP.parseOgrenim("Lisans 1988, Doktora 1996", YIL).doktoraYili === 1996);
check("öğrenim: doktora önce yıl", TP.parseOgrenim("1996 doktora", YIL).doktoraYili === 1996);
check("öğrenim: yüksek lisans", TP.parseOgrenim("Yüksek Lisans 2015", YIL).duzey === "yuksek_lisans");
check("öğrenim: lisans", TP.parseOgrenim("Lisans 2019", YIL).duzey === "lisans");
check("öğrenim: yılsız doktora", TP.parseOgrenim("Doktora mezunu", YIL).duzey === "doktora" &&
      TP.parseOgrenim("Doktora mezunu", YIL).doktoraYili === null);
check("öğrenim: boş", TP.parseOgrenim("", YIL) === null);

// ---- textparse: tecrübe ----
const tec = TP.parseTecrube("YÖKAK dış değerlendirme takım başkanlığı, kurumsal akreditasyon");
check("tecrübe: çoklu bulgu", tec.bulgular.length >= 3, tec);
check("tecrübe: 100 tavanı", tec.puan <= 100);
check("tecrübe: bulgu yok", TP.parseTecrube("uzun yıllar öğretmenlik yaptım").bulgular.length === 0);
check("tecrübe: boş", TP.parseTecrube("") === null);

// ---- sütun eşleştirme ----
const cols = Engine.matchColumns(["TcNo","Universite","Tip","Akademik Görev","AkademikUnvan","IdariGorev",
  "Ad","Soyad","Temel Alan","Bilim Alan","TkBsk","AkdGor","IdrGor","Tecrube","YabanciDil","Ogrenim","Secim"]);
check("sütun: tam uyum", cols.eksik.length === 0 && cols.fazladan.length === 0, cols);

const cols2 = Engine.matchColumns(["TC Kimlik No","Kurum","Tip","Ad","Soyad","Ekstra Sütun"]);
check("sütun: eşanlam eşleşir", cols2.mapping["TC Kimlik No"] === "TcNo" && cols2.mapping["Kurum"] === "Universite");
check("sütun: fazladan raporlanır", cols2.fazladan.indexOf("Ekstra Sütun") !== -1);
check("sütun: eksik raporlanır", cols2.eksik.indexOf("Tecrube") !== -1);

// ---- analiz uçtan uca ----
function satir(ekstra) {
  return Object.assign({
    "TcNo": "11111111111", "Universite": "Test Üni", "Tip": "Akademik",
    "Akademik Görev": "Dekan", "AkademikUnvan": "Prof. Dr.", "IdariGorev": "",
    "Ad": "Ali", "Soyad": "Veli", "Temel Alan": "Mühendislik", "Bilim Alan": "X",
    "TkBsk": 3, "AkdGor": 5, "IdrGor": 0,
    "Tecrube": "YÖKAK dış değerlendirme, kurumsal akreditasyon, kalite komisyonu",
    "YabanciDil": "YDS 90", "Ogrenim": "Doktora 2000", "Secim": "E"
  }, ekstra || {});
}

const crit = Criteria.cloneCriteria(Criteria.DEFAULT_CRITERIA);
const a1 = Engine.analyze([satir()], crit, { simdikiYil: YIL });
check("analiz: güçlü aday davet", a1.results[0].status === "davet", a1.results[0]);
check("analiz: puan 0-100 aralığında", a1.results[0].total > 0 && a1.results[0].total <= 100);

// Zorunlu alan eksik → eksik
const a2 = Engine.analyze([satir({ "Ad": "" })], crit, { simdikiYil: YIL });
check("analiz: zorunlu alan boş → eksik", a2.results[0].status === "eksik");
check("analiz: eksik alan raporlanır", a2.results[0].missing.indexOf("Ad") !== -1);

// Mükerrer TcNo → ikincisi eksik
const a3 = Engine.analyze([satir(), satir()], crit, { simdikiYil: YIL });
check("analiz: mükerrer kayıt", a3.results.filter(r => r.status === "eksik").length === 1);

// Doktora şartı: Öğr. Gör. + yüksek lisans → uygun-degil
const a4 = Engine.analyze([satir({
  "AkademikUnvan": "Öğr. Gör.", "Ogrenim": "Yüksek Lisans 2015", "Akademik Görev": ""
})], crit, { simdikiYil: YIL });
check("analiz: doktora şartı eler", a4.results[0].status === "uygun-degil", a4.results[0].reasons);

// İdari muafiyet: doktora şartı idariyi elememeli
const a5 = Engine.analyze([satir({
  "Tip": "İdari", "AkademikUnvan": "", "Akademik Görev": "", "IdariGorev": "Daire Başkanı",
  "Ogrenim": "Lisans 2001", "IdrGor": 4, "TkBsk": 0, "AkdGor": 0,
  "Tecrube": "ISO 9001 kalite yönetim sistemi, YÖKAK idari değerlendirici", "YabanciDil": ""
})], crit, { simdikiYil: YIL });
check("analiz: idari muafiyet", a5.results[0].status !== "uygun-degil" ||
      a5.results[0].reasons.every(r => r.indexOf("Doktora") === -1), a5.results[0].reasons);
check("analiz: idari unvan kriteri uygulanmaz", a5.results[0].scores.unvan.uygulanir === false);

// Kontenjan: 1 kişilik kontenjanda ikinci aday sınırda kalır
const critK = Criteria.cloneCriteria(crit);
critK.davet.kontenjan = 1;
const a6 = Engine.analyze([satir(), satir({ "TcNo": "22222222222", "AkademikUnvan": "Doç. Dr.", "TkBsk": 1 })],
  critK, { simdikiYil: YIL });
check("analiz: kontenjan uygulanır",
  a6.results.filter(r => r.status === "davet").length === 1 &&
  a6.results.filter(r => r.status === "sinirda").length === 1, a6.summary);
check("analiz: kontenjan en yüksek puanı korur",
  a6.results.find(r => r.status === "davet").total >= a6.results.find(r => r.status === "sinirda").total);

// Havuz bonusu
const critB = Criteria.cloneCriteria(crit);
critB.secim.havuzBonus = 5;
const b1 = Engine.analyze([satir()], crit, { simdikiYil: YIL }).results[0].total;
const b2 = Engine.analyze([satir()], critB, { simdikiYil: YIL }).results[0].total;
check("analiz: havuz bonusu eklenir", Math.abs(b2 - Math.min(100, b1 + 5)) < 0.11, { b1, b2 });

// Hedef alan: alan dışı aday puan kaybeder
const critA = Criteria.cloneCriteria(crit);
critA.hedefAlanlar = ["Sağlık Bilimleri"];
const a7 = Engine.analyze([satir()], critA, { simdikiYil: YIL });
check("analiz: hedef alan dışı 0 alır", a7.results[0].scores.alan.puan === 0 && a7.results[0].scores.alan.uygulanir);
const a8 = Engine.analyze([satir({ "Temel Alan": "Sağlık Bilimleri" })], critA, { simdikiYil: YIL });
check("analiz: hedef alan içi 100 alır", a8.results[0].scores.alan.puan === 100);

// Asgari dil şartı
const critD = Criteria.cloneCriteria(crit);
critD.mandatory.minYabanciDilPuan = 95;
const a9 = Engine.analyze([satir()], critD, { simdikiYil: YIL });
check("analiz: asgari dil şartı eler", a9.results[0].status === "uygun-degil", a9.results[0].reasons);

// Özet sayıları tutarlı
const hepsi = [satir(), satir({ "TcNo": "2", "AkademikUnvan": "Arş. Gör.", "Ogrenim": "Lisans 2019" }),
               satir({ "TcNo": "3", "Ad": "" })];
const a10 = Engine.analyze(hepsi, crit, { simdikiYil: YIL });
const s = a10.summary;
check("analiz: özet toplamı", s.davet + s.sinirda + s["uygun-degil"] + s.eksik === s.toplam, s);

console.log("\nSonuç: " + passed + " başarılı, " + failed + " başarısız.");
process.exit(failed ? 1 : 0);
