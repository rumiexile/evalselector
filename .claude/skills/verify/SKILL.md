---
name: verify
description: Bu projedeki değişiklikleri gerçek uygulamada uçtan uca doğrulama tarifi (statik sunucu + Playwright/Chromium).
---

# Doğrulama tarifi

Derleme adımı yok; uygulama statik dosyalardan çalışır.

## Başlatma

```bash
python3 -m http.server 8377 --bind 127.0.0.1 &   # repo kökünden
```

## Sürüş (Playwright)

Scratchpad'e `npm install playwright` yeter; tarayıcı hazır kuruludur:

```js
const { chromium } = require("playwright");
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
});
// dizin adı sürümle değişebilir: ls /opt/pw-browsers/
```

`playwright install` ÇALIŞTIRMA (ağ kısıtlı; tarayıcı zaten kurulu).

## İşe yarayan akışlar

- Takım modülüne geçiş: `.modtab[data-mod="takim"]` tıkla.
- Kurum listesi: arama `#k-arama`, satırlar `#kurum-liste label`,
  seçim sayacı `#k-secili-sayi`, kaynak satırı `#k-kaynak-bilgi`.
- YÖKAK MIS güncelleme penceresi: `#btn-kurum-guncelle` → `#kurum-guncelle-modal`;
  içerik `#kg-metin`e yapıştırılıp `#kg-cikar` → önizleme `#kg-onizleme` →
  `#kg-uygula`. Sentetik MIS sayfası üretmek için `Universities.EMBEDDED`'dan
  `<tr><td>AD</td><td>İL</td><td>TÜR</td></tr>` satırları yeterli.
- Onay pencereleri `#confirm-modal` (`#confirm-ok`/`#confirm-cancel`).
- Bildirimler `#toast` içinde görünür.

## Dikkat

- Değerlendirici havuzu gerektiren akışlar için ana sekmedeki
  "Örnek veriyle dene" düğmesi sentetik havuz yükler.
- localStorage kalıcılığını sınarken `page.reload()` yeterli;
  temiz başlangıç için yeni context aç.
