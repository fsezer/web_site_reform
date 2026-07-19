# Android — Admin TWA (Trusted Web Activity)

Admin önce **PWA** olarak yüklenebilir (`/Admin` + `admin.webmanifest`). Play Store paketi isteğe bağlı sonraki adımdır.

## Önkoşul

1. Canlıda PWA çalışıyor: https://www.sanastechnology.com/Admin  
2. Chrome’da “Uygulamayı yükle” veya Ana Ekrana Ekle denenmiş  
3. Google Play Developer hesabı hazır

## Bubblewrap (özet)

```bash
npm i -g @bubblewrap/cli
mkdir -p android/twa && cd android/twa
bubblewrap init --manifest https://www.sanastechnology.com/admin.webmanifest
# packageId örn: com.sanastechnology.admin
# startUrl: /Admin
bubblewrap build
```

Üretilen AAB’yi Play Console’a yükle (Internal testing yeterli).

## Digital Asset Links

Play imza SHA-256 alındıktan sonra siteye koy:

`public/.well-known/assetlinks.json`

Şablon: `android/twa/assetlinks.template.json`  
nginx zaten `/public` altını yayınlar; `.well-known` Vite `public/` ile dist’e kopyalanır.

SHA yokken boş/yanlış dosya **yükleme** — şablonu doldurup sonra deploy et.

## API / Business Profile

Google Business Profile **API** ayrı OAuth + doğrulama ister; yerel SEO için önce [business.google.com](https://business.google.com/) profili yeter. Admin → Ayarlar → NAP checklist.
