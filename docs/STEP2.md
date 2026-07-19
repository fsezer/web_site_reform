# Adım 2 — Süper SEO (uygulama)

Adım 1 (admin + Firestore CMS) bitti. Adım 2 hedefi: **yerel görünürlük + ölçüm**.

## Bu pakette (kod)

1. Organization / LocalBusiness şeması (tüm sayfalar)
2. Search Console doğrulama meta (Ayarlar → kaydet)
3. Yerel fırsat → SEO taslağı (Dashboard)

## Senin elle (5–15 dk)

1. [Search Console](https://search.google.com/search-console) → mülk ekle `https://www.sanastechnology.com`
2. Meta kodunu Ayarlar’a yapıştır → Kaydet
3. Sitemap gönder: `/sitemap.xml` + indirilen SEO XML
4. Haftada 2–4 fırsat taslağını **özgünleştir** → Yayınla

## Sonraki (adım 2 devam)

- [x] FAQPage + Article şeması yayınlanan içerikte  
- [x] `##` başlık render  
- [x] 2 örnek yerel landing (yazılım + yapay zeka) sitemap’te  
- [x] Analiz: ham path + GA4/SC kısayolları  
- [x] GA4 Data API (Cloud Run `sanas-ga4-api` + Admin **GA4’ten çek**)  
- [x] Search Console Data API (`/sc` + Admin **Search Console çek**)  
- [x] GA4’te SA’ya Viewer ver (elle, bir kez)  
- [x] Search Console’da SA’ya kullanıcı (Tam) ver (elle, bir kez)  
- [x] Admin PWA (manifest + SW + yükle)  
- [x] Business Profile: NAP şema + Admin checklist (mevcut profil; API yok)  
- [x] Android TWA rehberi (`docs/ANDROID_TWA.md` + şablon; Play SHA sonra)  

AI SEO: henüz yok; sen yazarsın.

## Adım 2 bitti — senin süren

1. Mevcut [Google İşletme](https://business.google.com/) profilinde NAP = site (telefon / adres / web)  
2. Haftada 2–4 yerel fırsat taslağını özgünleştir → Yayınla  
3. (İsteğe bağlı) Play: Bubblewrap → `assetlinks.json`  

Sonraki sprint fikirleri: kalan 4 yerel landing, içerik skoru iyileştirme.

## Adım 3 (başladı)

- [x] Bing / Yandex doğrulama meta (Ayarlar → Search Console kartı)  


- [ ] Admin **Webmaster** kartı (GSC, Bing, Yandex, PageSpeed, Tag Assistant, GA4)
- [ ] `/.well-known/security.txt` canlı
- [ ] App Links iskeleti (`assetlinks.json`, `apple-app-site-association`)
- [ ] GA4 **Tag Assistant** ile ölçüm doğrulama
- [ ] `sanas_mobile` (TWA / admin uygulaması) paket hazırlığı
