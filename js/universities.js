/*
 * universities.js — Türkiye'deki yükseköğretim kurumları listesi.
 * Gömülü liste çevrimdışı yedektir; güncel liste YÖKAK MIS'in kurum
 * listesinden (KAYNAKLAR) güncellenebilir:
 *   - Arayüzden: "YÖK listesinden güncelle" (sayfa doğrudan indirilir ya da
 *     içeriği yapıştırılır, parse() ayrıştırır, apply() localStorage'a yazar).
 *   - Komut satırından / MCP oturumunda: `node tools/update-universities.js`
 *     gömülü listeyi bu dosyada yeniden üretir.
 * Alanlar: ad, il (şehir), tur ("Devlet" | "Vakıf" | "Diğer"), ulke (boş = Türkiye)
 */
(function (root) {
  "use strict";

  // Güncelleme kaynakları; sırayla denenir. Tek resmî kaynak YÖKAK MIS'tir
  // (YÖKAK'ın kendi alanı; aynı alandan/ağdan çalıştırıldığında CORS'a takılmaz).
  var KAYNAKLAR = [
    { ad: "YÖKAK MIS", url: "https://mis.yokak.gov.tr/Common/Universities" }
  ];
  var LS_KEY = "evalselector.universities.v1";

  function U(ad, il, tur) { return { ad: ad, il: il, tur: tur }; }

  // Elle kurum eklemede kullanılan ülke listesi (Türkiye ilk sırada)
  var COUNTRIES = ["Türkiye",
    "ABD", "Almanya", "Arnavutluk", "Avustralya", "Avusturya", "Azerbaycan",
    "Bahreyn", "Belçika", "Birleşik Arap Emirlikleri", "Birleşik Krallık",
    "Bosna-Hersek", "Bulgaristan", "Çekya", "Çin", "Danimarka", "Endonezya",
    "Estonya", "Fas", "Filistin", "Finlandiya", "Fransa", "Güney Kore",
    "Gürcistan", "Hindistan", "Hollanda", "Irak", "İran", "İrlanda",
    "İspanya", "İsveç", "İsviçre", "İtalya", "Japonya", "Kanada", "Katar",
    "Kazakistan", "Kırgızistan", "KKTC", "Kosova", "Kuveyt", "Letonya",
    "Litvanya", "Lübnan", "Macaristan", "Makedonya", "Malezya", "Mısır",
    "Moğolistan", "Moldova", "Karadağ", "Norveç", "Özbekistan", "Pakistan",
    "Polonya", "Portekiz", "Romanya", "Rusya", "Sırbistan", "Singapur",
    "Slovakya", "Slovenya", "Suudi Arabistan", "Tacikistan", "Tunus",
    "Türkmenistan", "Ukrayna", "Ürdün", "Yunanistan", "Diğer"];

  // >>> KURUM-LISTESI — tools/update-universities.js bu bloğu yeniden üretir.
  // EMBEDDED_GUNCELLEME: listenin YÖK kaynağından üretildiği an (null = elle derlenmiş).
  var EMBEDDED_GUNCELLEME = "2026-07-14T17:59:19.060Z";
  var EMBEDDED = [
    // ---- Devlet üniversiteleri ----
    U("Abdullah Gül Üniversitesi", "Kayseri", "Devlet"),
    U("Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi", "Adana", "Devlet"),
    U("Adıyaman Üniversitesi", "Adıyaman", "Devlet"),
    U("Afyon Kocatepe Üniversitesi", "Afyonkarahisar", "Devlet"),
    U("Afyonkarahisar Sağlık Bilimleri Üniversitesi", "Afyonkarahisar", "Devlet"),
    U("Ağrı İbrahim Çeçen Üniversitesi", "Ağrı", "Devlet"),
    U("Akdeniz Üniversitesi", "Antalya", "Devlet"),
    U("Aksaray Üniversitesi", "Aksaray", "Devlet"),
    U("Alanya Alaaddin Keykubat Üniversitesi", "Antalya", "Devlet"),
    U("Amasya Üniversitesi", "Amasya", "Devlet"),
    U("Anadolu Üniversitesi", "Eskişehir", "Devlet"),
    U("Ankara Hacı Bayram Veli Üniversitesi", "Ankara", "Devlet"),
    U("Ankara Müzik ve Güzel Sanatlar Üniversitesi", "Ankara", "Devlet"),
    U("Ankara Sosyal Bilimler Üniversitesi", "Ankara", "Devlet"),
    U("Ankara Üniversitesi", "Ankara", "Devlet"),
    U("Ankara Yıldırım Beyazıt Üniversitesi", "Ankara", "Devlet"),
    U("Ardahan Üniversitesi", "Ardahan", "Devlet"),
    U("Artvin Çoruh Üniversitesi", "Artvin", "Devlet"),
    U("Atatürk Üniversitesi", "Erzurum", "Devlet"),
    U("Aydın Adnan Menderes Üniversitesi", "Aydın", "Devlet"),
    U("Balıkesir Üniversitesi", "Balıkesir", "Devlet"),
    U("Bandırma Onyedi Eylül Üniversitesi", "Balıkesir", "Devlet"),
    U("Bartın Üniversitesi", "Bartın", "Devlet"),
    U("Batman Üniversitesi", "Batman", "Devlet"),
    U("Bayburt Üniversitesi", "Bayburt", "Devlet"),
    U("Bilecik Şeyh Edebali Üniversitesi", "Bilecik", "Devlet"),
    U("Bingöl Üniversitesi", "Bingöl", "Devlet"),
    U("Bitlis Eren Üniversitesi", "Bitlis", "Devlet"),
    U("Boğaziçi Üniversitesi", "İstanbul", "Devlet"),
    U("Bolu Abant İzzet Baysal Üniversitesi", "Bolu", "Devlet"),
    U("Burdur Mehmet Akif Ersoy Üniversitesi", "Burdur", "Devlet"),
    U("Bursa Teknik Üniversitesi", "Bursa", "Devlet"),
    U("Bursa Uludağ Üniversitesi", "Bursa", "Devlet"),
    U("Çanakkale Onsekiz Mart Üniversitesi", "Çanakkale", "Devlet"),
    U("Çankırı Karatekin Üniversitesi", "Çankırı", "Devlet"),
    U("Çukurova Üniversitesi", "Adana", "Devlet"),
    U("Dicle Üniversitesi", "Diyarbakır", "Devlet"),
    U("Dokuz Eylül Üniversitesi", "İzmir", "Devlet"),
    U("Düzce Üniversitesi", "Düzce", "Devlet"),
    U("Ege Üniversitesi", "İzmir", "Devlet"),
    U("Erciyes Üniversitesi", "Kayseri", "Devlet"),
    U("Erzincan Binali Yıldırım Üniversitesi", "Erzincan", "Devlet"),
    U("Erzurum Teknik Üniversitesi", "Erzurum", "Devlet"),
    U("Eskişehir Osmangazi Üniversitesi", "Eskişehir", "Devlet"),
    U("Eskişehir Teknik Üniversitesi", "Eskişehir", "Devlet"),
    U("Fırat Üniversitesi", "Elazığ", "Devlet"),
    U("Galatasaray Üniversitesi", "İstanbul", "Devlet"),
    U("Gazi Üniversitesi", "Ankara", "Devlet"),
    U("Gaziantep İslam Bilim ve Teknoloji Üniversitesi", "Gaziantep", "Devlet"),
    U("Gaziantep Üniversitesi", "Gaziantep", "Devlet"),
    U("Gebze Teknik Üniversitesi", "Kocaeli", "Devlet"),
    U("Giresun Üniversitesi", "Giresun", "Devlet"),
    U("Gümüşhane Üniversitesi", "Gümüşhane", "Devlet"),
    U("Hacettepe Üniversitesi", "Ankara", "Devlet"),
    U("Hakkari Üniversitesi", "Hakkari", "Devlet"),
    U("Harran Üniversitesi", "Şanlıurfa", "Devlet"),
    U("Hatay Mustafa Kemal Üniversitesi", "Hatay", "Devlet"),
    U("Hitit Üniversitesi", "Çorum", "Devlet"),
    U("Iğdır Üniversitesi", "Iğdır", "Devlet"),
    U("Isparta Uygulamalı Bilimler Üniversitesi", "Isparta", "Devlet"),
    U("İnönü Üniversitesi", "Malatya", "Devlet"),
    U("İskenderun Teknik Üniversitesi", "Hatay", "Devlet"),
    U("İstanbul Medeniyet Üniversitesi", "İstanbul", "Devlet"),
    U("İstanbul Teknik Üniversitesi", "İstanbul", "Devlet"),
    U("İstanbul Üniversitesi", "İstanbul", "Devlet"),
    U("İstanbul Üniversitesi-Cerrahpaşa", "İstanbul", "Devlet"),
    U("İzmir Bakırçay Üniversitesi", "İzmir", "Devlet"),
    U("İzmir Demokrasi Üniversitesi", "İzmir", "Devlet"),
    U("İzmir Kâtip Çelebi Üniversitesi", "İzmir", "Devlet"),
    U("İzmir Yüksek Teknoloji Enstitüsü", "İzmir", "Devlet"),
    U("Kafkas Üniversitesi", "Kars", "Devlet"),
    U("Kahramanmaraş İstiklal Üniversitesi", "Kahramanmaraş", "Devlet"),
    U("Kahramanmaraş Sütçü İmam Üniversitesi", "Kahramanmaraş", "Devlet"),
    U("Karabük Üniversitesi", "Karabük", "Devlet"),
    U("Karadeniz Teknik Üniversitesi", "Trabzon", "Devlet"),
    U("Karamanoğlu Mehmetbey Üniversitesi", "Karaman", "Devlet"),
    U("Kastamonu Üniversitesi", "Kastamonu", "Devlet"),
    U("Kayseri Üniversitesi", "Kayseri", "Devlet"),
    U("Kırıkkale Üniversitesi", "Kırıkkale", "Devlet"),
    U("Kırklareli Üniversitesi", "Kırklareli", "Devlet"),
    U("Kırşehir Ahi Evran Üniversitesi", "Kırşehir", "Devlet"),
    U("Kilis 7 Aralık Üniversitesi", "Kilis", "Devlet"),
    U("Kocaeli Üniversitesi", "Kocaeli", "Devlet"),
    U("Konya Teknik Üniversitesi", "Konya", "Devlet"),
    U("Kütahya Dumlupınar Üniversitesi", "Kütahya", "Devlet"),
    U("Kütahya Sağlık Bilimleri Üniversitesi", "Kütahya", "Devlet"),
    U("Malatya Turgut Özal Üniversitesi", "Malatya", "Devlet"),
    U("Manisa Celal Bayar Üniversitesi", "Manisa", "Devlet"),
    U("Mardin Artuklu Üniversitesi", "Mardin", "Devlet"),
    U("Marmara Üniversitesi", "İstanbul", "Devlet"),
    U("Mersin Üniversitesi", "Mersin", "Devlet"),
    U("Mimar Sinan Güzel Sanatlar Üniversitesi", "İstanbul", "Devlet"),
    U("Muğla Sıtkı Koçman Üniversitesi", "Muğla", "Devlet"),
    U("Munzur Üniversitesi", "Tunceli", "Devlet"),
    U("Muş Alparslan Üniversitesi", "Muş", "Devlet"),
    U("Necmettin Erbakan Üniversitesi", "Konya", "Devlet"),
    U("Nevşehir Hacı Bektaş Veli Üniversitesi", "Nevşehir", "Devlet"),
    U("Niğde Ömer Halisdemir Üniversitesi", "Niğde", "Devlet"),
    U("Ondokuz Mayıs Üniversitesi", "Samsun", "Devlet"),
    U("Ordu Üniversitesi", "Ordu", "Devlet"),
    U("Orta Doğu Teknik Üniversitesi", "Ankara", "Devlet"),
    U("Osmaniye Korkut Ata Üniversitesi", "Osmaniye", "Devlet"),
    U("Pamukkale Üniversitesi", "Denizli", "Devlet"),
    U("Recep Tayyip Erdoğan Üniversitesi", "Rize", "Devlet"),
    U("Sağlık Bilimleri Üniversitesi", "İstanbul", "Devlet"),
    U("Sakarya Uygulamalı Bilimler Üniversitesi", "Sakarya", "Devlet"),
    U("Sakarya Üniversitesi", "Sakarya", "Devlet"),
    U("Samsun Üniversitesi", "Samsun", "Devlet"),
    U("Selçuk Üniversitesi", "Konya", "Devlet"),
    U("Siirt Üniversitesi", "Siirt", "Devlet"),
    U("Sinop Üniversitesi", "Sinop", "Devlet"),
    U("Sivas Bilim ve Teknoloji Üniversitesi", "Sivas", "Devlet"),
    U("Sivas Cumhuriyet Üniversitesi", "Sivas", "Devlet"),
    U("Süleyman Demirel Üniversitesi", "Isparta", "Devlet"),
    U("Şırnak Üniversitesi", "Şırnak", "Devlet"),
    U("Tarsus Üniversitesi", "Mersin", "Devlet"),
    U("Tekirdağ Namık Kemal Üniversitesi", "Tekirdağ", "Devlet"),
    U("Tokat Gaziosmanpaşa Üniversitesi", "Tokat", "Devlet"),
    U("Trabzon Üniversitesi", "Trabzon", "Devlet"),
    U("Trakya Üniversitesi", "Edirne", "Devlet"),
    U("Türk-Alman Üniversitesi", "İstanbul", "Devlet"),
    U("Uşak Üniversitesi", "Uşak", "Devlet"),
    U("Van Yüzüncü Yıl Üniversitesi", "Van", "Devlet"),
    U("Yalova Üniversitesi", "Yalova", "Devlet"),
    U("Yıldız Teknik Üniversitesi", "İstanbul", "Devlet"),
    U("Yozgat Bozok Üniversitesi", "Yozgat", "Devlet"),
    U("Zonguldak Bülent Ecevit Üniversitesi", "Zonguldak", "Devlet"),
    // ---- Vakıf üniversiteleri ----
    U("Acıbadem Mehmet Ali Aydınlar Üniversitesi", "İstanbul", "Vakıf"),
    U("Alanya Üniversitesi", "Antalya", "Vakıf"),
    U("Altınbaş Üniversitesi", "İstanbul", "Vakıf"),
    U("Ankara Bilim Üniversitesi", "Ankara", "Vakıf"),
    U("Ankara Medipol Üniversitesi", "Ankara", "Vakıf"),
    U("Antalya Belek Üniversitesi", "Antalya", "Vakıf"),
    U("Antalya Bilim Üniversitesi", "Antalya", "Vakıf"),
    U("Ataşehir Adıgüzel Meslek Yüksekokulu", "İstanbul", "Vakıf"),
    U("Atılım Üniversitesi", "Ankara", "Vakıf"),
    U("Avrasya Üniversitesi", "Trabzon", "Vakıf"),
    U("Bahçeşehir Üniversitesi", "İstanbul", "Vakıf"),
    U("Başkent Üniversitesi", "Ankara", "Vakıf"),
    U("Beykoz Üniversitesi", "İstanbul", "Vakıf"),
    U("Bezm-i Âlem Vakıf Üniversitesi", "İstanbul", "Vakıf"),
    U("Biruni Üniversitesi", "İstanbul", "Vakıf"),
    U("Çağ Üniversitesi", "Mersin", "Vakıf"),
    U("Çankaya Üniversitesi", "Ankara", "Vakıf"),
    U("Demiroğlu Bilim Üniversitesi", "İstanbul", "Vakıf"),
    U("Doğuş Üniversitesi", "İstanbul", "Vakıf"),
    U("Fatih Sultan Mehmet Vakıf Üniversitesi", "İstanbul", "Vakıf"),
    U("Fenerbahçe Üniversitesi", "İstanbul", "Vakıf"),
    U("Haliç Üniversitesi", "İstanbul", "Vakıf"),
    U("Hasan Kalyoncu Üniversitesi", "Gaziantep", "Vakıf"),
    U("Işık Üniversitesi", "İstanbul", "Vakıf"),
    U("İbn Haldun Üniversitesi", "İstanbul", "Vakıf"),
    U("İhsan Doğramacı Bilkent Üniversitesi", "Ankara", "Vakıf"),
    U("İstanbul 29 Mayıs Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Arel Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Atlas Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Aydın Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Beykent Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Bilgi Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Esenyurt Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Galata Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Gedik Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Gelişim Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Kent Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Kültür Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Medipol Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Nişantaşı Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Okan Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Rumeli Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Sabahattin Zaim Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Sağlık ve Sosyal Bilimler Meslek Yüksekokulu", "İstanbul", "Vakıf"),
    U("İstanbul Sağlık ve Teknoloji Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Şişli Meslek Yüksekokulu", "İstanbul", "Vakıf"),
    U("İstanbul Ticaret Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Topkapı Üniversitesi", "İstanbul", "Vakıf"),
    U("İstanbul Yeni Yüzyıl Üniversitesi", "İstanbul", "Vakıf"),
    U("İstinye Üniversitesi", "İstanbul", "Vakıf"),
    U("İzmir Ekonomi Üniversitesi", "İzmir", "Vakıf"),
    U("İzmir Kavram Meslek Yüksekokulu", "İzmir", "Vakıf"),
    U("İzmir Tınaztepe Üniversitesi", "İzmir", "Vakıf"),
    U("Kadir Has Üniversitesi", "İstanbul", "Vakıf"),
    U("Kapadokya Üniversitesi", "Nevşehir", "Vakıf"),
    U("Kocaeli Sağlık ve Teknoloji Üniversitesi", "Kocaeli", "Vakıf"),
    U("Koç Üniversitesi", "İstanbul", "Vakıf"),
    U("Konya Gıda ve Tarım Üniversitesi", "Konya", "Vakıf"),
    U("KTO Karatay Üniversitesi", "Konya", "Vakıf"),
    U("Lokman Hekim Üniversitesi", "Ankara", "Vakıf"),
    U("Maltepe Üniversitesi", "İstanbul", "Vakıf"),
    U("MEF Üniversitesi", "İstanbul", "Vakıf"),
    U("Mudanya Üniversitesi", "Bursa", "Vakıf"),
    U("Nuh Naci Yazgan Üniversitesi", "Kayseri", "Vakıf"),
    U("OSTİM Teknik Üniversitesi", "Ankara", "Vakıf"),
    U("Özyeğin Üniversitesi", "İstanbul", "Vakıf"),
    U("Piri Reis Üniversitesi", "İstanbul", "Vakıf"),
    U("Sabancı Üniversitesi", "İstanbul", "Vakıf"),
    U("Sanko Üniversitesi", "Gaziantep", "Vakıf"),
    U("TED Üniversitesi", "Ankara", "Vakıf"),
    U("TOBB Ekonomi ve Teknoloji Üniversitesi", "Ankara", "Vakıf"),
    U("Toros Üniversitesi", "Mersin", "Vakıf"),
    U("Türk Hava Kurumu Üniversitesi", "Ankara", "Vakıf"),
    U("Ufuk Üniversitesi", "Ankara", "Vakıf"),
    U("Üsküdar Üniversitesi", "İstanbul", "Vakıf"),
    U("Yaşar Üniversitesi", "İzmir", "Vakıf"),
    U("Yeditepe Üniversitesi", "İstanbul", "Vakıf"),
    U("Yüksek İhtisas Üniversitesi", "Ankara", "Vakıf")
  ];
  // <<< KURUM-LISTESI

  // Canlı liste: gömülü kopyayla başlar; setList() içeriği yerinde değiştirir
  // (uygulama genelindeki Universities.UNIVERSITIES referansları geçerli kalır).
  var UNIVERSITIES = EMBEDDED.map(kopya);
  var META = { kaynak: "gomulu", guncelleme: EMBEDDED_GUNCELLEME };

  function kopya(u) {
    var k = { ad: u.ad, il: u.il || "—", tur: u.tur || "Diğer" };
    if (u.ulke) k.ulke = u.ulke;
    return k;
  }

  // ---------------- Yardımcılar ----------------

  // Türkçe duyarsız normalizasyon (textparse.norm'a bağımlılık olmadan;
  // bu dosya Node altında tek başına da kullanılır).
  var TR_MAP = {
    "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g",
    "Ü": "u", "ü": "u", "Ö": "o", "ö": "o", "Ç": "c", "ç": "c",
    "Â": "a", "â": "a", "Î": "i", "î": "i", "Û": "u", "û": "u"
  };
  function trNorm(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/[İIıŞşĞğÜüÖöÇçÂâÎîÛû]/g, function (c) { return TR_MAP[c]; })
      .toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Bağlaçlar başlık düzeninde küçük kalır; kısaltmalar olduğu gibi korunur.
  var BAGLAC = { "ve": 1, "ile": 1, "için": 1 };
  var KISALTMALAR = ["KTO", "MEF", "OSTİM", "TED", "TOBB", "THK", "ATASAREN", "MSÜ"];
  function trTitleCase(s) {
    var sozcukler = String(s).toLocaleLowerCase("tr-TR").split(/\s+/).map(function (w, i) {
      if (i > 0 && BAGLAC[w]) return w;
      var kis = KISALTMALAR.find(function (k) { return k.toLocaleLowerCase("tr-TR") === w; });
      if (kis) return kis;
      // Tire sonrası da büyütülür ("türk-alman" -> "Türk-Alman"); tek harflik
      // parça izafettir, küçük kalır ("bezm-i âlem" -> "Bezm-i Âlem").
      return w.split("-").map(function (p, j) {
        if (j > 0 && p.length === 1) return p;
        return p.replace(/(^|[("'.])([a-zçğıöşüâîû])/g, function (m, sep, ch) {
          return sep + ch.toLocaleUpperCase("tr-TR");
        });
      }).join("-");
    });
    return sozcukler.join(" ");
  }

  var NAMED_ENTITIES = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    Ccedil: "Ç", ccedil: "ç", Ouml: "Ö", ouml: "ö", Uuml: "Ü", uuml: "ü",
    Acirc: "Â", acirc: "â", Icirc: "Î", icirc: "î", Ucirc: "Û", ucirc: "û"
  };
  function decodeEntities(s) {
    return String(s)
      .replace(/&#x([0-9a-fA-F]+);/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); })
      .replace(/&([a-zA-Z]+);/g, function (m, n) { return NAMED_ENTITIES[n] || m; });
  }
  function stripTags(s) {
    return decodeEntities(String(s).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  }

  // 81 il — sayfadaki şehir sütununu/metnini yakalamada kullanılır
  var ILLER = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya",
    "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın",
    "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
    "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce",
    "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep",
    "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
    "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu",
    "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli",
    "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla",
    "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya",
    "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ",
    "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat",
    "Zonguldak"];
  var IL_INDEX = {};
  ILLER.forEach(function (il) { IL_INDEX[trNorm(il)] = il; });

  // ---------------- YÖK sayfası ayrıştırıcısı ----------------
  // universityListview.jsp'nin HTML'ini (tam sayfa kaynağı, tablo parçası ya da
  // kopyalanıp yapıştırılan düz metin) kurum kayıtlarına çevirir. Sayfa yapısı
  // değişebildiğinden üç aşamalı ve toleranslıdır: tablo satırları -> bağlantı
  // metinleri -> düz metin satırları.
  var KURUM_ANAHTAR = /(universite|enstitu|akadem|yuksekokul)/;
  // Menü/başlık benzeri genel etiketler kurum adı sayılmaz.
  // Dikkat: parçalı kalıplar tam ifade olmalı ("arama" tek başına olursa
  // "K-arama-noğlu" gibi adlar da elenir).
  var GENEL_ETIKET = new RegExp(
    "^(t\\.?c\\.?\\s+)?((tum|devlet|vakif)\\s+)?universite(ler|si)?$" +
    "|^universite (tipi|adi|turu)$" + // tablo sütun başlıkları (ör. MIS)
    "|universite (listesi|ara)|akademik arama|arama sonuc");

  function adayOlustur(hucreler) {
    var ad = null, il = null, tur = null;
    hucreler.forEach(function (h) {
      var n = trNorm(h);
      if (!n) return;
      if (!tur && /^devlet( universitesi)?$/.test(n)) { tur = "Devlet"; return; }
      if (!tur && /^vakif( universitesi| myo| meslek yuksekokulu)?$/.test(n)) {
        tur = "Vakıf"; return;
      }
      if (!il && IL_INDEX[n]) { il = IL_INDEX[n]; return; }
      if (!ad && n.length >= 10 && KURUM_ANAHTAR.test(n) && !GENEL_ETIKET.test(n)) {
        // Baştaki sıra numarası ve fazla boşluklar atılır
        ad = h.replace(/^\s*\d+\s*[.)-]?\s*/, "").replace(/\s+/g, " ").trim();
      }
    });
    if (!ad) return null;
    return { ad: ad, il: il, tur: tur };
  }

  function parseKurumListesi(girdi) {
    girdi = String(girdi || "");
    var adaylar = [];

    function eklenmisSayisi() { return adaylar.length; }

    // JSON uç noktası (ör. MIS): nesnelerin dizgi alanları hücre gibi taranır,
    // alan adlarından bağımsız çalışır.
    var kirpik = girdi.trim();
    if (/^[\[{]/.test(kirpik)) {
      try {
        jsonTara(JSON.parse(kirpik), adaylar);
        if (adaylar.length) return birlestir(adaylar);
      } catch (e) { /* JSON değilmiş: metin/HTML olarak devam */ }
      adaylar = [];
    }

    if (girdi.indexOf("<") !== -1) {
      // 1) Tablo satırları (hücreler ayrı sütunlar: ad / il / tür)
      (girdi.match(/<tr[\s\S]*?<\/tr>/gi) || []).forEach(function (satir) {
        var hucreler = (satir.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map(stripTags);
        var k = adayOlustur(hucreler);
        if (k) adaylar.push(k);
      });
      // 2) Yeterli kayıt çıkmadıysa bağlantı metinleri (liste görünümü)
      if (eklenmisSayisi() < 5) {
        adaylar = [];
        (girdi.match(/<a\b[\s\S]*?<\/a>/gi) || []).forEach(function (a) {
          var k = adayOlustur([stripTags(a)]);
          if (k) adaylar.push(k);
        });
      }
      // 3) Hâlâ yoksa: etiketleri satır sonlarına çevirip düz metin gibi tara
      if (eklenmisSayisi() < 5) {
        adaylar = [];
        duzMetinTara(decodeEntities(girdi
          .replace(/<(br|\/tr|\/li|\/p|\/div|\/h[1-6])[^>]*>/gi, "\n")
          .replace(/<[^>]*>/g, " ")), adaylar);
      }
    } else {
      duzMetinTara(girdi, adaylar);
    }

    return birlestir(adaylar);
  }

  function jsonTara(dugum, adaylar) {
    if (Array.isArray(dugum)) { dugum.forEach(function (d) { jsonTara(d, adaylar); }); return; }
    if (!dugum || typeof dugum !== "object") return;
    var degerler = [];
    Object.keys(dugum).forEach(function (k) {
      var v = dugum[k];
      if (typeof v === "string") degerler.push(v);
      else if (v && typeof v === "object") jsonTara(v, adaylar);
    });
    var k2 = adayOlustur(degerler);
    if (k2) adaylar.push(k2);
  }

  function duzMetinTara(metin, adaylar) {
    metin.split(/\r?\n/).forEach(function (satir) {
      var hucreler = satir.split(/\t|;|·|\|| {2,}/).map(function (h) {
        return h.replace(/\s+/g, " ").trim();
      }).filter(Boolean);
      if (!hucreler.length) return;
      var k = adayOlustur(hucreler);
      if (k) adaylar.push(k);
    });
  }

  // Tekrarları ele, eksik il/tür bilgisini mevcut (gömülü ya da canlı)
  // listeden tamamla; yeni adları Türkçe başlık düzenine çevir.
  function birlestir(adaylar) {
    var bilinen = {};
    UNIVERSITIES.concat(EMBEDDED).forEach(function (u) {
      var n = trNorm(u.ad);
      if (!bilinen[n]) bilinen[n] = u;
    });
    var gorulen = {}, kurumlar = [], eksikBilgi = [];
    adaylar.forEach(function (k) {
      var n = trNorm(k.ad);
      if (gorulen[n]) { // tekrar: eksik alanları tamamlamak için kullan
        var v = gorulen[n];
        if (!v.il && k.il) v.il = k.il;
        if (!v.tur && k.tur) v.tur = k.tur;
        return;
      }
      var kayit = { ad: k.ad, il: k.il, tur: k.tur };
      var eski = bilinen[n];
      if (eski) {
        kayit.ad = eski.ad;               // özenli yazım korunur (Kâtip, Bezmiâlem…)
        if (!kayit.il) kayit.il = eski.il;
        if (!kayit.tur) kayit.tur = eski.tur;
      } else if (kayit.ad === kayit.ad.toLocaleUpperCase("tr-TR")) {
        kayit.ad = trTitleCase(kayit.ad); // YÖK sayfası adları BÜYÜK harfle verir
      }
      gorulen[n] = kayit;
      kurumlar.push(kayit);
    });
    kurumlar.forEach(function (k) {
      if (!k.il || !k.tur) eksikBilgi.push(k.ad);
      k.il = k.il || "—";
      k.tur = k.tur || "Diğer";
    });
    return { kurumlar: kurumlar, eksikBilgi: eksikBilgi };
  }

  // ---------------- Liste yönetimi ----------------
  function setList(liste, meta) {
    UNIVERSITIES.length = 0;
    liste.forEach(function (u) { UNIVERSITIES.push(kopya(u)); });
    META = {
      kaynak: (meta && meta.kaynak) || "yok",
      guncelleme: (meta && meta.guncelleme) || null
    };
  }

  // Yeni listeyi uygula ve tarayıcıda kalıcılaştır
  function applyList(liste) {
    setList(liste, { kaynak: "yok", guncelleme: new Date().toISOString() });
    if (tarayicida()) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          kurumlar: UNIVERSITIES, guncelleme: META.guncelleme
        }));
      } catch (e) { /* depolama dolu/kapalı: bellek içi liste yine geçerli */ }
    }
    return META;
  }

  function resetList() {
    setList(EMBEDDED, { kaynak: "gomulu", guncelleme: EMBEDDED_GUNCELLEME });
    if (tarayicida()) {
      try { localStorage.removeItem(LS_KEY); } catch (e) { /* yoksay */ }
    }
  }

  function diffAgainstCurrent(yeniListe) {
    var eski = {}, yeni = {};
    UNIVERSITIES.forEach(function (u) { eski[trNorm(u.ad)] = u.ad; });
    yeniListe.forEach(function (u) { yeni[trNorm(u.ad)] = u.ad; });
    var eklenen = [], cikan = [];
    Object.keys(yeni).forEach(function (n) { if (!eski[n]) eklenen.push(yeni[n]); });
    Object.keys(eski).forEach(function (n) { if (!yeni[n]) cikan.push(eski[n]); });
    return { eklenen: eklenen, cikan: cikan };
  }

  function tarayicida() {
    return typeof document !== "undefined" && typeof localStorage !== "undefined";
  }

  // Tarayıcıda: daha önce YÖK'ten güncellenmiş liste varsa onunla başla
  if (tarayicida()) {
    try {
      var sakli = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (sakli && Array.isArray(sakli.kurumlar) && sakli.kurumlar.length) {
        setList(sakli.kurumlar, { kaynak: "yok", guncelleme: sakli.guncelleme || null });
      }
    } catch (e) { /* bozuk kayıt: gömülü listeyle devam */ }
  }

  var api = {
    UNIVERSITIES: UNIVERSITIES,
    COUNTRIES: COUNTRIES,
    EMBEDDED: EMBEDDED,
    KAYNAKLAR: KAYNAKLAR,
    meta: function () { return META; },
    parse: parseKurumListesi,
    setList: setList,
    apply: applyList,
    reset: resetList,
    diff: diffAgainstCurrent,
    norm: trNorm,
    titleCase: trTitleCase
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Universities = api;
})(typeof self !== "undefined" ? self : this);
