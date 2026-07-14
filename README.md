# Değerlendirici Seçim Sistemi

**Tamamen tarayıcı içinde çalışan**, iki modüllü web uygulaması:

1. **Değerlendirici Seçimi** — başvuru Excel dosyasını kriter setine göre
   analiz eder, eğitime davet edilecek adayları önerir, uygun olmayan ya da
   eksik veriye sahip başvuruları raporlar.
2. **Takım Oluşturma** — değerlendirme türüne (KAP, KAP — Ara Değerlendirme,
   UKAP, UKAP — İzleme, KDDP, KDDP — İzleme + kullanıcı tanımlı türler) göre şablon tabanlı
   değerlendirme takımlarını (yalnızca asil) **rastlantısal yöntemle** kurar;
   türe bağlı ortak **yedek havuzu**, çıkar çatışması kontrolü ve "Değiştir"
   ile takas yoluyla üye değişimini destekler.

## Kullanım

Kurulum gerektirmez:

1. `index.html` dosyasını bir tarayıcıda açın (veya klasörü herhangi bir
   statik sunucuyla yayınlayın: `python3 -m http.server`).
2. Başvuru Excel dosyasını (.xlsx/.xls/.csv) sürükleyip bırakın — ya da
   **"Örnek veriyle dene"** düğmesiyle uygulamayı sentetik veriyle inceleyin.
3. Gerekirse kriter ağırlıklarını, zorunlu koşulları, davet eşiğini,
   kontenjanı ve hedef temel alanları düzenleyin; analiz otomatik yenilenir.
4. **"Rapor İndir (Excel)"** ile Özet, Davet Önerilenler, Sınırda, Uygun
   Olmayanlar, Eksik Veri ve Tüm Sonuçlar sayfalarını içeren raporu alın.

### Takım Oluşturma modülü

1. Üstteki **"2 · Takım Oluşturma"** sekmesine geçin; dönem adını yazın ve
   değerlendirme türünü seçin (yeni tür tanımlanabilir).
2. Takım şablonunu gözden geçirin: akademik üye sayısı, idari/öğrenci
   zorunluluğu, başkan görev kriteri, UKAP için asgari dil puanı, ilk kez
   görev alacak üye aralığı, yedek havuzu (rol başına kişi sayısı).
3. Kurum listesinden değerlendirilecek üniversiteleri seçin (eksik kurumlar
   elle eklenebilir). Liste gömülü kopyayla gelir; **"YÖK listesinden
   güncelle"** ile [YÖK Akademik üniversite listesinden](https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp)
   yenilenebilir (sayfa doğrudan indirilemezse kaydedilmiş sayfa yüklenir ya
   da içerik yapıştırılır; güncel liste tarayıcıda saklanır).
4. **"Eksik takımları otomatik kur (rastlantısal)"** ile asil kadroları kurun.
   Türe bağlı **Yedek Havuzu** kartında **"Havuzu oluştur/güncelle"** ile
   yedekleri hazırlayın. Bir üyeyi **Değiştir** ile değiştirdiğinizde önce
   yedek havuzundan, sonra değerlendirici havuzundan uygun adaylar sunulur;
   yerine geçen kişi havuzdan çıkar, çıkan asil havuza döner (takas).
5. Çıkar çatışması beyanlarını kaydedin; takım kartlarındaki canlı doğrulama
   uyarılarını giderin ve **"Takımları indir (Excel)"** ile raporu alın.
   Oturumlar arası devam için **"Çalışmayı kaydet (JSON)"** kullanın.

## Veri Gizliliği (KVKK)

- Yüklenen dosya **hiçbir sunucuya gönderilmez**; tüm ayrıştırma ve puanlama
  tarayıcı içinde yapılır, sayfa kapatılınca veri silinir.
- T.C. kimlik numaraları ekranda maskeli gösterilir; tam değer yalnızca
  indirilen raporda bulunur.
- Uygulama çevrimdışı da çalışır (SheetJS kütüphanesi yerel kopyadır).

## Beklenen Dosya Yapısı

İlk çalışma sayfasında şu sütunlar aranır (büyük/küçük harf ve Türkçe
karakter duyarsız; yaygın eşanlamlar tanınır): `TcNo, Universite, Tip,
Akademik Görev, AkademikUnvan, IdariGorev, Ad, Soyad, Temel Alan, Bilim Alan,
TkBsk, AkdGor, IdrGor, Tecrube, YabanciDil, Ogrenim, Secim`.

Eksik/tanınmayan sütunlar arayüzde raporlanır. Ayrıntılı puanlama modeli ve
mimari için bkz. [`docs/TASARIM.md`](docs/TASARIM.md).

## Geliştirme

```bash
node test/engine.test.js        # ayrıştırıcı ve puanlama motoru birim testleri
node test/teams.test.js         # takım kurma kuralları
node test/universities.test.js  # YÖK kurum listesi ayrıştırıcısı
```

Gömülü kurum listesi YÖK Akademik'ten yeniden üretilebilir:

```bash
node tools/update-universities.js            # sayfayı indir + js/universities.js'i güncelle
node tools/update-universities.js --dry-run  # yazmadan farkları göster
node tools/update-universities.js --in kayitli-sayfa.html  # indirme engellenirse
```

(Claude Code/MCP oturumunda "kurum listesini güncelle" isteği
`.claude/skills/kurum-listesi-guncelle` becerisiyle aynı akışı çalıştırır.)

Puanlama çekirdeği (`js/criteria.js`, `js/textparse.js`, `js/engine.js`)
hem tarayıcıda hem Node.js altında çalışır; derleme adımı yoktur.

> Bu araç kural tabanlı otomatik ön değerlendirme yapar; sonuçlar öneri
> niteliğindedir. Nihai davet kararı yetkili komisyona aittir.
