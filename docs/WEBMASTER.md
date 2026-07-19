# Webmaster checklist — Sanas

Canlı: https://www.sanastechnology.com  
Ölçüm: GA4 `G-HY4FN9MXS9` · property `546157474`

## Kurulum (bitti / kod)

| Madde | Durum |
|-------|--------|
| robots.txt + sitemap.xml | ✓ |
| Canonical + OG + Twitter | ✓ |
| Favicon seti | ✓ |
| Organization / LocalBusiness JSON-LD | ✓ |
| Google Search Console (DNS) | ✓ |
| Bing / Yandex meta alanları (Admin) | ✓ |
| Yandex DNS TXT + ana sayfa meta | ✓ |
| GA4 gtag (Tag Assistant uyumlu) | ✓ |
| `/ .well-known/security.txt` | ✓ |
| App Links iskeleti (assetlinks + AASA) | ✓ (SHA sonra) |
| Admin Webmaster araç linkleri | ✓ |

## Senin elle (tek sefer)

1. ~~PageSpeed Insights~~ → artık Admin → Analiz → PageSpeed kartı
2. ~~Tag Assistant~~ (yapıldıysa atla)
3. ~~Bing~~ Import from GSC (yapıldıysa atla)
4. ~~Yandex~~ Sitemap `/sitemap.xml` (yapıldıysa atla)
5. ~~Google İşletme~~ NAP = Karagözlü Sok. No:46 (yapıldıysa atla)
6. ~~GA4 ↔ Search Console~~ bağlantısı (yapıldı)
7. GA4 Data retention → **14 ay** (Admin → Data settings) — bir kez kontrol et
8. GSC’de ana URL’lere “Request indexing” (isteğe bağlı hızlandırma)

## Sürekli (manuel, arada)

- Ayda 1–2 özgün içerik / yerel fırsat taslağını güçlendirip Yayınla
- Google İşletme fotoğraf / yorum
- `security.txt` yıllık yenileme (2027)

## Araç kısayolları

- Search Console: https://search.google.com/search-console  
- Bing: https://www.bing.com/webmasters  
- Yandex: https://webmaster.yandex.com/  
- PageSpeed: https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.sanastechnology.com%2F  
- GA4: https://analytics.google.com/analytics/web/#/p546157474/  
- Tag Assistant (Chrome): https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk  

## Sonradan (mobil app)

`sanas_mobile` Play/App Store imzası gelince:
- `public/.well-known/assetlinks.json` → SHA-256 doldur  
- `public/.well-known/apple-app-site-association` → team id doğrula  
