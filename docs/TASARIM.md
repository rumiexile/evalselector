# Değerlendirici Seçim Sistemi — Tasarım Dokümanı

Uygulama iki modülden oluşur:

1. **Değerlendirici Seçimi** — başvuruların kriter setine göre analizi ve
   eğitim daveti önerisi (bu bölümde anlatılır).
2. **Takım Oluşturma** — değerlendirme türüne göre şablon tabanlı,
   rastlantısal takım kurulumu (bkz. [Bölüm 9](#9-modül-2-takım-oluşturma)).

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
5. **Havuz analitiği** (`js/charts.js`): sonuç tablosunun altında, tüm havuza
   ait (filtrelerden bağımsız) dağılım grafikleri — özet istatistik tümceleri,
   temel alan / akademik unvan / üniversite dağılımları (yatay çubuk),
   değerlendirme tecrübesi (histogram), E/Y oranı, tip ve cinsiyet dengesi
   (halka). Grafikler bağımlılıksız HTML/CSS ile çizilir; YÖKAK mavi paleti
   kullanılır ve her değer doğrudan etiketlenir. **Cinsiyet** dosyada bir alan
   olmadığından yalnızca **ada göre tahminidir** (tanınmayan adlar "Belirsiz");
   resmî gösterge değildir.

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

## 9. Modül 2: Takım Oluşturma

Değerlendirme dönemine ve türüne göre, YÖKAK "Değerlendirici Havuzu,
Değerlendirme Takımlarının Oluşturulması ve Dış Değerlendiricilerin Görev
İhmallerine Uygulanacak Yaptırımlara İlişkin Usul ve Esaslar" belgesindeki
kuralları öntanımlı şablon değerleri olarak uygulayan takım kurma aracı.
Havuz olarak 1. modülde yüklenen başvuru dosyası kullanılır; `Tip` sütununda
**Öğrenci** değeri de tanınır (öğrenci değerlendiriciler için).

### 9.1 Değerlendirme türleri ve şablonlar

Öntanımlı türler: **KAP**, **KAP — Ara Değerlendirme**, **UKAP**,
**UKAP — İzleme**, **KDDP**, **KDDP — İzleme**. Arayüzden yeni tür tanımlanabilir
(geleceğe dönük); yeni türler taban şablonla başlar ve düzenlenebilir.
Ara değerlendirme ve izleme türleri (KAP — Ara Değerlendirme, UKAP — İzleme,
KDDP — İzleme) küçültülmüş takım şablonuyla gelir: 2 akademik üye, öğrenci
zorunluluğu ve ilk kez görev şartı kapalı; UKAP — İzleme'de ayrıca asgari dil
puanı 80'dir.

Şablon alanları ve Usul-Esaslar dayanakları:

| Alan | Öntanımlı | Dayanak |
|---|---|---|
| Akademik üye sayısı (başkan hariç) | 3 (Ara ve izleme türleri: 2) | Kurum büyüklüğüne göre takım (8/1-7) |
| İdari değerlendirici bulunsun | Evet | Takımlarda akademik, idari, öğrenci zorunlu (8/3) |
| Öğrenci değerlendirici bulunsun | Evet (Ara ve izleme türleri: Hayır) | 8/3 |
| Başkan asgari görev sayısı (TkBsk+AkdGor+IdrGor) | 3 | En az 3 kez dış değerlendirici (8/9) |
| Asgari dil puanı (başkan + akademik) | 0; UKAP türlerinde 80 | Kullanıcı gereksinimi (UKAP dil düzeyi) |
| İlk kez görev alacak üye: en az / en fazla | 1 / 2 | 8/8 (öğrenciler sayım dışı tutulur) |
| Aynı üniversiteden en fazla bir üye | Açık | Coğrafi/alan dengesi (8/4) sadeleştirmesi |
| Yedek havuzu — rol başına kişi | 1 | Türe bağlı ortak yedek havuzunun otomatik doldurma miktarı |
| Takım başkanı Prof. Dr. olmalı | Açık | Kullanıcı gereksinimi |
| Takım başkanı akademik üyelerden tecrübeli olmalı | Açık | Başkan görev sayısı > akademik üyeler (idari/öğrenci kapsam dışı) |
| Vakıf idari yalnızca devlet kurumlarına | Açık | Vakıf üniversitesi mensubu idari değerlendirici başka bir vakıf kuruma atanamaz |
| Cinsiyet dengesi gözetilsin | Açık (yumuşak) | Ada göre tahmini; kadın/erkek sayısı eşite yakın olmalı |

> Vakıf/Devlet ayrımı gömülü üniversite listesindeki tür bilgisinden okunur;
> kurum listede yoksa (elle eklenen ya da tanınmayan) kural uygulanmaz.
> Başkan **önce** seçilir; **akademik** üyeler başkandan daha az tecrübeli
> olacak biçimde atanır (idari ve öğrenci üyeler bu kısıttan muaftır).
> Cinsiyet dengesi otomatik kurulumda yumuşak tercih olarak
> uygulanır (eksik cinsiyet öncelenir) ve sağlanamazsa uyarı üretilir.

"İlk kez görev alacak" tespiti: `TkBsk + AkdGor + IdrGor = 0`.

### 9.2 Kurum seçimi

Türkiye'deki üniversiteler (devlet + vakıf, şehir ve tür bilgisiyle) uygulama
içinde gömülüdür; arama ve tür filtresiyle seçilir. Listede olmayan kurumlar
elle eklenebilir — ad, şehir, ülke (öntanımlı Türkiye; UKAP gibi yurt dışı
değerlendirmeler için ülke listesinden seçilir) ve tür. Eklenenler tarayıcıda
saklanır; Türkiye dışındaki kurumlarda ülke adı listede ve takım kartında
gösterilir. Bir kurum seçimden çıkarılırsa kurulmuş takımı da kaldırılır.

Gömülü liste resmî kaynaklardan güncellenebilir; kaynaklar sırayla denenir
(`Universities.KAYNAKLAR`): **YÖKAK MIS** (`mis.yokak.gov.tr/Common/Universities`)
ve **YÖK Akademik** (`universityListview.jsp`). İki yol vardır; ikisi de
`Universities.parse` ayrıştırıcısını kullanır (JSON → tablo satırları →
bağlantı metinleri → düz metin sırasıyla denenir; bilinen kurumların özenli
yazımı korunur, yeni adlar Türkçe başlık düzenine çevrilir, il/tür
doğrulanamayanlar "Diğer"/"—" işaretlenir):

- **Arayüzden** ("YÖK listesinden güncelle"): her kaynak önce doğrudan, sonra
  herkese açık CORS aracıları (allorigins, corsproxy, r.jina.ai) üzerinden
  indirilmeye çalışılır; olmazsa kaydedilmiş sayfa
  yüklenir ya da içerik yapıştırılır. Fark önizlemesi (eklenen/çıkan, eksik
  bilgi, seçili olup listeden düşenler) onaylanınca liste `localStorage`'a
  yazılır ve o tarayıcıda gömülü listenin yerine geçer; "Gömülü listeye dön"
  ile geri alınır. Seçili olup yeni listede olmayan kurumlar elle eklenmiş
  kurum olarak korunur.
- **Komut satırından / MCP oturumunda** (`node tools/update-universities.js`,
  bkz. `.claude/skills/kurum-listesi-guncelle`): `js/universities.js` içindeki
  gömülü blok (`>>> KURUM-LISTESI` işaretçileri arası) yeniden üretilir; bu
  kalıcı yoldur ve tüm kullanıcılara dağıtılır. Betik 150'den az kurum bulursa
  sayfa yapısı değişti varsayımıyla yazmayı reddeder (`--force` ile geçilir).

### 9.3 Takım kurulumu, yedek havuzu ve değiştirme

Takımlar yalnızca **asil** kadrodan oluşur. Yedekler takım bazında değil,
**değerlendirme türüne bağlı ortak bir yedek havuzunda** tutulur ve gerektiğinde
"Değiştir" ile çağrılır.

- **Otomatik (rastlantısal) asil kurulum**: şablon kriterlerini ve ÇÇ kontrolünü
  geçen adaylar arasından rastgele seçim yapılır (8/5'teki rastlantısal yöntem).
  Sıra: başkan → akademik üyeler (önce ilk kez görev alacaklardan asgari sayı) →
  idari → öğrenci.
- **Yedek havuzu**: her tür için ayrı tutulur (rol başına). "Havuzu oluştur/
  güncelle" ile role uygun, henüz bağlı olmayan değerlendiricilerle şablondaki
  sayı kadar rastlantısal doldurulur; elle "Ekle"/"Çıkar" ile düzenlenir. Havuz
  tüm takımlarca paylaşılır (kuruma bağlı değildir; ÇÇ yalnızca takıma
  yerleştirme anında uygulanır).
- **Değiştir/Seç (takas)**: bir koltuğun yanındaki düğme, önce **o türün yedek
  havuzundan** uygun kişileri, ardından **değerlendirici havuzundan** (henüz
  bağlı olmayan) uygun adayları gruplu olarak gösterir. Seçim yapıldığında
  seçilen kişi (havuzdaysa) havuzdan çıkar; koltuktaki önceki asil ise aynı
  türün yedek havuzuna alınır (takas).
- **Tek görev bütünlüğü**: bir kişi aynı anda ya bir takımın asili ya da bir
  yedek havuzunun üyesidir; her seçim, tüm takımların asilleri + tüm yedek
  havuzları kümesini dışlar.

### 9.4 Çıkar çatışması/çakışması (MADDE 9)

- **Otomatik**: adayın mensubu olduğu üniversite (metin normalize edilerek)
  değerlendirilen kurumla eşleşiyorsa aday elenir.
- **Elle beyan**: değerlendirici + kurum çifti olarak kaydedilir (mezuniyet,
  danışmanlık, ailevi bağ vb.); hem seçim filtresinde hem takım
  doğrulamasında uygulanır.
- Kurum adı yazımı farklıysa (örn. kısaltma) otomatik eşleşme yakalanamaz;
  bu durumlar elle beyanla yönetilir (arayüzde belirtilir).

### 9.5 Doğrulama ve raporlama

Her takım kartında canlı doğrulama gösterilir: boş koltuk, ÇÇ ihlali, rol
kriteri ihlali, ilk kez görev aralığı, aynı üniversiteden birden fazla üye,
dönem içinde birden fazla takımda asil görev. Dışa aktarma:

- **Excel**: "Özet" (kurum başına durum ve uyarılar) + "Takımlar" (asil kişiler,
  rol/kurum/dil/ilk kez) + "Yedek Havuzu" (türe göre yedekler).
- **Çalışma dosyası (JSON)**: dönem, şablonlar, kurum seçimi, takımlar ve ÇÇ
  beyanları; kaydet/yükle ile oturumlar arası taşınır.

### 9.6 Veri gizliliği

Takımlar ve ÇÇ beyanları kişisel veri (TcNo) içerdiğinden **yalnızca bellekte**
tutulur; localStorage'a kişisel veri yazılmaz. Kalıcılık isteyen kullanıcı
"Çalışmayı kaydet (JSON)" ile dosyayı kendisi indirir ve saklar. Kişisel veri
içermeyen ayarlar (dönem adı, türler, şablonlar, kurum seçimi, elle eklenen
kurumlar) tarayıcıda saklanır.

### 9.7 Sınırlar

- Cinsiyet dengesi (8/4) veri dosyasında cinsiyet alanı bulunmadığından
  otomatik gözetilemez; coğrafi/alan dengesi "aynı üniversiteden tek üye"
  kuralıyla yaklaşık sağlanır.
- Gömülü üniversite listesi güncel YÖK listesinden küçük farklar içerebilir;
  elle ekleme ile telafi edilir.
- Sektör temsilcisi ve uluslararası uzman rolleri (8/3'te isteğe bağlı)
  ayrı rol olarak modellenmemiştir; gerekirse akademik koltuk + elle seçim
  ile yönetilebilir ya da ileride rol olarak eklenebilir.
