# Değerlendirici Seçim Sistemi

Değerlendirici başvurularını içeren Excel dosyalarını belirlenmiş kriter
setine göre analiz eden, eğitime davet edilecek adayları öneren ve uygun
olmayan ya da eksik veriye sahip başvuruları raporlayan **tamamen tarayıcı
içinde çalışan** web uygulaması.

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
