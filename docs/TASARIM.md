# Değerlendirici Seçim Sistemi — Tasarım Dokümanı

## 1. Amaç

Yükseköğretim kalite güvencesi süreçlerinde görev alacak değerlendirici
başvurularının (Excel dosyası) belirlenmiş kriter setine göre analiz edilmesi,
eğitime davet edilecek adayların önerilmesi ve uygun olmayan ya da eksik veriye
sahip başvuruların raporlanması.

Sistem yalnızca **veriye dayalı** karar üretir; serbest metin alanlarında
çözümlenemeyen içerik olduğunda adayı eksik/incelemeli olarak işaretler ve
elle inceleme önerir. Nihai davet kararı her zaman yetkili komisyona aittir —
uygulama çıktıları **öneri** niteliğindedir.

## 2. Mimari

**Tamamen tarayıcı içinde çalışan statik tek sayfa uygulaması.** Sunucu, veri
tabanı ve ağ bağlantısı gerektirmez; `index.html` dosyasının tarayıcıda
açılması yeterlidir.

Bu mimarinin seçilme gerekçesi veri gizliliğidir: başvuru dosyaları T.C.
kimlik numarası içerir (KVKK kapsamında özel nitelikli veri işleme riski).
Dosya hiçbir sunucuya yüklenmez; tüm ayrıştırma ve puanlama kullanıcının
tarayıcısında yapılır, sayfa kapatıldığında veri bellekten silinir. Ekranda
T.C. kimlik numaraları maskeli gösterilir (ilk 3 + son 2 hane); tam değer
yalnızca indirilen Excel raporunda yer alır.

### Katmanlar

| Dosya | Sorumluluk |
|---|---|
| `index.html` | Sayfa iskeleti (Türkçe arayüz) |
| `css/style.css` | Kurumsal, sade görünüm |
| `js/lib/xlsx.full.min.js` | SheetJS (yerel kopya — çevrimdışı çalışır) |
| `js/criteria.js` | Öntanımlı kriter seti, kriter doğrulama/birleştirme |
| `js/textparse.js` | Serbest metin ayrıştırıcıları (unvan, görev, dil, öğrenim, tecrübe) |
| `js/engine.js` | Sütun eşleştirme, puanlama, uygunluk ve sıralama motoru |
| `js/report.js` | Excel rapor üretimi (SheetJS) |
| `js/app.js` | Arayüz bağlama: yükleme, kriter formu, tablo, detay, dışa aktarma |

`criteria.js`, `textparse.js` ve `engine.js` hem tarayıcıda hem Node.js
altında çalışır; birim testleri (`test/engine.test.js`) bu sayede sunucusuz
koşturulur.

## 3. Veri Modeli

Beklenen 17 sütun (görev tanımındaki şablon): TcNo, Universite, Tip,
Akademik Görev, AkademikUnvan, IdariGorev, Ad, Soyad, Temel Alan, Bilim Alan,
TkBsk, AkdGor, IdrGor, Tecrube, YabanciDil, Ogrenim, Secim.

- Başlıklar Türkçe karakter/boşluk/büyük-küçük duyarsız eşleştirilir; yaygın
  eşanlamlar tanınır (ör. "TC Kimlik No" → TcNo, "Kurum" → Universite).
- Eksik ve tanınmayan sütunlar kullanıcıya raporlanır. Zorunlu sütunlar
  (TcNo, Ad, Soyad, Tip) yoksa analiz başlatılmaz.
- **Zorunlu alanlar** (TcNo, Universite, Tip, Ad, Soyad) boş olan satırlar
  puanlanmaz, "Eksik Veri" olarak raporlanır. Mükerrer TcNo'lu satırların
  ilki değerlendirilir, sonrakiler "Eksik Veri"ye mükerrer gerekçesiyle düşer.

## 4. Puanlama Modeli

Her kriter 0–100 aralığında puanlanır; toplam puan, kriter ağırlıklarıyla
**kişi bazında uygulanabilir kriterler üzerinden normalize edilerek** hesaplanır
(ör. idari personelde akademik unvan kriteri kapsam dışıdır; hedef alan
seçilmemişse alan kriteri tüm adaylar için devre dışıdır).

### Kriterler ve öntanımlı ağırlıklar

| Kriter | Ağırlık | Hesaplama |
|---|---|---|
| Akademik Unvan | 20 | Prof. 100 · Doç. 85 · Dr. Öğr. Üyesi 70 · Öğr. Gör. 45 · Arş. Gör. 25 |
| Akademik / İdari Görev | 10 | 24 kademeli hiyerarşi doğrusal ölçeklenir (1. sıra=100 … 24. sıra=20); hiyerarşide eşleşmeyen görev taban 20 alır; idari personelde idari görev varlığı 60 |
| Değerlendirici Deneyimi | 25 | `min(100, TkBsk×20 + AkdGor×10 + IdrGor×10)` |
| Kalite Güvencesi Tecrübesi | 15 | Metinde anahtar ifade çıkarımı (YÖKAK, dış değerlendirme, kurumsal/program akreditasyonu, kalite komisyonu, KİDR, ISO 9001 vb.); puanlar toplanır, 100 ile sınırlanır |
| Yabancı Dil | 10 | Sınav adı + puan ayrıştırılır (YDS, YÖKDİL, KPDS, ÜDS, e-YDS, TOEFL, IELTS, PTE); 100'lük eşdeğere doğrusal çevrilir, en yükseği alınır |
| Öğrenim Durumu | 10 | Doktora 60 + doktora sonrası yıl×4 (en çok +40) · Yüksek lisans 30 · Lisans 10 |
| Alan Uygunluğu | 10 | Temel Alan, seçilen hedef alanlar içindeyse 100, değilse 0; hedef alan seçilmemişse kriter devre dışı |

Ek olarak `Secim = "E"` (mevcut havuz) adaylarına yapılandırılabilir bonus
puan eklenebilir (öntanımlı 0).

> Not: TOEFL/IELTS çevirimi doğrusal orandır ve yaklaşık eşdeğerdir; resmî
> ÖSYM eşdeğerlik tablosu birebir uygulanmaz. Gerekirse asgari dil şartı bu
> pay dikkate alınarak belirlenmelidir.

### Zorunlu (eleyici) koşullar — öntanımlı

- **Doktora / sanatta yeterlik şartı** (açık): Öğrenim metninde doktora ya da
  unvan seviyesi ≤ 3 (Dr. Öğr. Üyesi ve üstü) doktora karinesi sayılır.
- **Asgari unvan**: Dr. Öğr. Üyesi ve üstü.
- **Asgari yabancı dil puanı**: kapalı (0).
- **İdari muafiyet** (açık): İdari personel unvan/doktora şartlarından muaftır.

Zorunlu koşulu sağlamayan aday, puanından bağımsız olarak "Uygun Değil"
durumuna düşer ve gerekçesi raporlanır.

### Durum kararı

1. `eksik` — zorunlu alan boş ya da mükerrer kayıt (puanlanmaz)
2. `uygun-degil` — zorunlu koşul sağlanmıyor **veya** puan < eşik − bant
3. `sinirda` — eşik − bant ≤ puan < eşik (elle inceleme önerilir) **veya**
   kontenjan dışında kalan davet adayı (yedek)
4. `davet` — puan ≥ eşik (kontenjan tanımlıysa en yüksek puanlı N aday)

Öntanımlı: eşik 60, bant 5, kontenjan kapalı. GPT davranış tanımındaki
"ihtiyatlı yaklaşım", sınır bandı ve tüm çözümlenemeyen/eksik verilerin not
olarak raporlanmasıyla karşılanır.

## 5. Serbest Metin Ayrıştırma

Tüm eşleştirmeler Türkçe karakter duyarsız normalize metin üzerinde düzenli
ifadelerle yapılır (deterministik, tekrarlanabilir, denetlenebilir):

- **Unvan**: hiyerarşik kalıplar; "Yrd. Doç." tarihsel unvanı Dr. Öğr. Üyesi
  seviyesine eşlenir ve "Doç." kuralından önce sınanır.
- **Görev**: 24 kademeli hiyerarşi kalıpları; müdür/müdür yardımcısı gibi
  içiçe kalıplar ayrıştırılır. Eşleşmeyen görev "hiyerarşi dışı" olarak
  işaretlenir ve not düşülür.
- **Yabancı dil**: `<sınav adı> … <sayı>` kalıbı; sınavın puan aralığı dışına
  düşen değerler elenir; birden çok sınavdan en yüksek eşdeğer alınır.
- **Öğrenim**: düzey anahtar kelimeleri + doktora yılı için önce
  "doktora → yıl", bulunamazsa "yıl → doktora" yönlü arama.
- **Tecrübe**: puanlı anahtar ifade sözlüğü; hiçbir ifade bulunamayan dolu
  metin "elle inceleme önerilir" notu üretir.

Çözümlenemeyen her alan hem aday detayında hem Excel raporunda not olarak
görünür — sistem sessizce 0 verip geçmez.

## 6. Arayüz Akışı

1. **Dosya yükleme**: sürükle-bırak / dosya seçici (.xlsx, .xls, .csv). Sütun
   uyum raporu gösterilir. "Örnek veriyle dene" düğmesi gerçek kişi
   içermeyen 12 kayıtlık sentetik veri yükler.
2. **Kriter seti**: ağırlıklar, zorunlu koşullar, davet parametreleri ve
   dosyadaki değerlerden türetilen hedef alan seçimi. Değişiklikler
   `localStorage`'a kaydedilir ve analiz otomatik yenilenir. Kriter seti JSON
   olarak indirilebilir / yüklenebilir (dönemler arası paylaşım için).
3. **Sonuçlar**: özet kartları, durum/havuz filtresi, ad-kurum-alan araması,
   sıralı tablo. "Detay" ile kriter bazında puan dökümü, gerekçeler, notlar
   ve ham veri görüntülenir.
4. **Rapor**: tek tıkla Excel raporu — sayfalar: Özet (parametreler dâhil),
   Davet Önerilenler, Sınırda, Uygun Olmayanlar, Eksik Veri, Tüm Sonuçlar.

## 7. Test ve Doğrulama

- `test/engine.test.js` — 60 birim testi (Node.js, bağımlılıksız):
  ayrıştırıcılar, sütun eşleştirme, eleyici koşullar, kontenjan, bonus,
  mükerrer kayıt, özet tutarlılığı.
- Uçtan uca doğrulama Chromium üzerinde yapılmıştır: örnek veri analizi,
  filtreler, detay penceresi, kriter değişikliğinde yeniden analiz ve Excel
  indirme.

## 8. Bilinçli Sınırlar ve Olası Geliştirmeler

- Metin ayrıştırma kural tabanlıdır; sözlük dışı ifadeler puanlanmaz (ancak
  raporlanır). İstenirse Claude API ile isteğe bağlı metin analizi katmanı
  eklenebilir (veri gizliliği değerlendirmesi yapılarak).
- ÖSYM dil eşdeğerlik tablosu birebir uygulanmıyor (doğrusal çevirim).
- Bilim Alanı düzeyinde eşleştirme yapılmıyor; hedefleme Temel Alan
  düzeyindedir.
- Çok sayfalı Excel dosyalarında yalnızca ilk sayfa okunur.
