# Değerlendirici Seçim Sistemi

**Tamamen tarayıcı içinde çalışan**, iki modüllü web uygulaması:

1. **Değerlendirici Seçimi** — başvuru Excel dosyasını kriter setine göre
   analiz eder, eğitime davet edilecek adayları önerir, uygun olmayan ya da
   eksik veriye sahip başvuruları raporlar.
2. **Takım Oluşturma** — değerlendirme türüne (KAP, KAP — Ara Değerlendirme,
   UKAP, UKAP — İzleme, KDDP, KDDP — İzleme + kullanıcı tanımlı türler) göre şablon tabanlı
   değerlendirme takımlarını **rastlantısal yöntemle** kurar; yedekleri,
   çıkar çatışması kontrolünü ve üye değiştirmeyi destekler.

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
   görev alacak üye aralığı, yedek sayısı.
3. Gömülü listeden değerlendirilecek üniversiteleri seçin (eksik kurumlar
   elle eklenebilir).
4. **"Eksik takımları otomatik kur (rastlantısal)"** ile takımları kurun ya da
   koltukları tek tek seçin; her üyenin yanındaki **Değiştir** düğmesi
   yedekleri ve havuzdaki uygun adayları gösterir.
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
node test/engine.test.js   # ayrıştırıcı ve puanlama motoru birim testleri
```

Puanlama çekirdeği (`js/criteria.js`, `js/textparse.js`, `js/engine.js`)
hem tarayıcıda hem Node.js altında çalışır; derleme adımı yoktur.

> Bu araç kural tabanlı otomatik ön değerlendirme yapar; sonuçlar öneri
> niteliğindedir. Nihai davet kararı yetkili komisyona aittir.
