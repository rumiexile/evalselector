---
name: kurum-listesi-guncelle
description: Değerlendirilecek kurumlar listesini YÖKAK MIS kurum listesinden (Common/Universities) yeniden üretir. Kullanıcı "kurum listesini güncelle", "üniversite listesini MIS'ten çek/yenile" gibi bir istekte bulununca kullan.
---

# Kurum listesini YÖKAK MIS'ten güncelleme

Uygulamanın "Değerlendirilecek Kurumlar" sekmesindeki liste `js/universities.js`
içindeki gömülü `EMBEDDED` dizisinden gelir. Bu beceri, listeyi resmî kaynaktan
yeniden üretir. Kaynak (`Universities.KAYNAKLAR`):

https://mis.yokak.gov.tr/Common/Universities (YÖKAK MIS; HTML ya da JSON —
ayrıştırıcı ikisini de işler)

## Adımlar

1. **Sayfayı edin.** Sırasıyla dene; ilk başarılı olanla devam et:
   - `node tools/update-universities.js --dry-run` — betik kaynakları sırayla
     kendisi indirmeyi dener ve farkları gösterir.
   - Betik indiremezse (MIS yurt dışı/veri merkezi IP'lerini
     ve tanımadığı istemcileri 403 ile engelleyebilir) `WebFetch` ya da varsa
     bir MCP fetch aracıyla sayfayı almayı dene; içeriği bir dosyaya yazıp
     `--in` ile ver.
   - O da olmazsa kullanıcıdan sayfayı tarayıcısında açıp **Ctrl+S ile
     kaydetmesini** (ya da içeriği kopyalayıp bir dosyaya yapıştırmasını) iste;
     dosyayı `--in` ile ver. Kullanıcı içeriği doğrudan sohbete de
     yapıştırabilir — o zaman scratchpad'e kaydedip `--in` ile kullan.

2. **Önce farkları göster:**
   `node tools/update-universities.js --in <dosya> --dry-run`
   Eklenen/çıkan kurumları ve "il/tür doğrulanamadı" uyarılarını kullanıcıya
   özetle. Beklenmedik derecede az kurum bulunursa (betik ≥150 bekler) sayfa
   yapısı değişmiş demektir; `js/universities.js` içindeki `parse()`
   ayrıştırıcısını sayfaya göre uyarla, `--force` ile geçiştirme.

3. **Yaz ve doğrula:**
   - `node tools/update-universities.js --in <dosya>`
   - `node test/universities.test.js && node test/engine.test.js && node test/teams.test.js`

4. **Commit et** (kullanıcının olağan akışına uygun biçimde) ve eklenen/çıkan
   kurumları commit mesajında özetle.

## Notlar

- Aynı ayrıştırıcı (`Universities.parse`) uygulama arayüzündeki "YÖKAK
  MIS'ten güncelle" penceresinde de çalışır; oradaki güncelleme yalnızca
  kullanıcının tarayıcısına (localStorage) yazılır. Kalıcı, herkese dağıtılan
  güncelleme bu becerideki yoldur (gömülü listeyi değiştirir).
- MIS sayfası adları BÜYÜK harfle verir; ayrıştırıcı bilinen kurumların özenli
  yazımını korur, yenilerini Türkçe başlık düzenine çevirir. Yeni bir kurumda
  il/tür doğrulanamadıysa kayıt "Diğer"/"—" olarak eklenir — mümkünse MIS
  sayfasındaki bilgiden elle düzeltip öyle commit et.
- `EMBEDDED_GUNCELLEME` alanını betik kendisi damgalar; elle düzenleme
  yaptıysan dokunma.
