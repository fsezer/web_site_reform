# Düşük maliyetli SEO — Sanas çalışma planı

Bu not **ücretli AI’ya bağımlı olmadan** (veya çok az maliyetle) SEO’yu güçlü tutmak içindir. Okuduktan sonra karar: şimdilik kural tabanlı devam; AI’yi sonra ince ayar olarak ekleriz.

---

## 1) “Kural tabanlı” ne demek?

Ücretli Gemini/OpenAI **çağırmadan**, admin panelinin zaten yaptığı gibi:

- Başlık + içerikten **meta title / description / keywords** üretmek  
- **SEO skor** ile eksikleri göstermek (uzunluk, keyword, İstiklal linki…)  
- **Yerel fırsat listesinden** (Eskişehir yazılım, yapay zeka…) sayfa açmak  
- Şablon: H1 → giriş → 3–5 H2 → kısa FAQ → İstiklal CTA  

Maliyet: **0 TL** (sadece senin zamanın).

---

## 2) SEO’yu gerçekten ne yükseltir? (öncelik sırası)

| Sıra | İş | Maliyet | Etki |
|------|-----|---------|------|
| 1 | Her URL tek niyet (doorway yok) | 0 | Çok yüksek |
| 2 | Yerel + hizmet sayfaları (Eskişehir × yazılım/AI/mobil…) | 0 | Çok yüksek |
| 3 | İstiklal Yazılım’a doğal iç/dış linkler | 0 | Yüksek |
| 4 | Search Console + düzgün sitemap | 0 | Yüksek |
| 5 | Kanıt: proje, 2004, tech stack (abartısız) | 0 | Yüksek |
| 6 | GA4 ile hangi sayfa ölüyor görmek | 0 | Orta–yüksek |
| 7 | Ücretli AI ile taslak hızlandırma | düşük | Orta (hız) |

**Sonuç:** Sıralamayı AI değil; **özgün sayfa + ölçüm + link + tutarlı NAP** taşır. AI sadece yazma hızıdır.

---

## 3) Günlük 10 sayfa üretmek mantıklı mı?

Kısa cevap: **Hayır — her gün 10 ince sayfa zarar bile verebilir.**

Daha iyi ritim:

- **Haftada 2–4 kaliteli** `/content/...` sayfa  
- Her biri: tek sorgu niyeti + 600+ kelime özgün metin + FAQ + İstiklal linki + skor ≥ 70  
- Ayda ~10–15 güçlü sayfa ≫ ayda 300 zayıf sayfa  

Google “içerik fabrikası”nı değil, **işe yarayan cevabı** sever.

---

## 4) Ücretli AI ne zaman?

Şunlardan **biri** olunca:

- Haftalık üretimi elle yetiştiremiyorsun  
- Sadece meta/özet için hız lazım  
- Taslağı sen mutlaka düzenliyorsun (ham AI yayınlama yok)

Kabaca (Gemini Flash sınıfı, 2026): sayfa başı **~0,5–3 TL**.  
Günde 3 kaliteli taslak ≈ **ayda birkaç yüz TL üstü değil** (modele göre).  
Günde 10 otomatik yayın ≈ gereksiz maliyet + kalite riski.

**Önerilen model:** Kural tabanlı skor + şablon (ücretsiz) → isteğe bağlı AI taslak → sen onay → yayın.

---

## 5) “Süper SEO” çalışma paketi (maliyet ≈ 0)

### A. İçerik matrisi (bir kez kur, tekrar kullan)

Satırlar: Eskişehir yazılım / AI / mobil / özel yazılım / bulut / kurumsal  
Sütunlar: nedir, nasıl seçilir, Sanas yaklaşımı, proje kanıtı, İstiklal köprüsü, FAQ  

Her hücre = **1 landing**. Kapı sayfası (aynı metin kopyası) yok.

### B. Yayın checklist (panel skorunun insan hali)

1. Slug kısa ve Türkçe ASCII  
2. Meta title 30–60, description 70–160  
3. En az 3 keyword, başlıkta 1 ana kelime  
4. Gövde ≥ ~400–800 kelime, ezber cümle yok  
5. En az 1 İstiklal linki + 1 sabit site içi link (Çözüm/Projeler)  
6. noindex sadece taslakta; hazır olunca index  
7. Sitemap’e sadece hazır URL  

### C. İstiklal bağlantı stratejisi

- Her SEO yazısında 1 ilgili CTA: “Türkiye operasyonu / mobil / AI için İstiklal”  
- İstiklal tarafında da Sanas’a kurumsal/global link (karşılıklı, spam değil)  
- Amaç: iki domain birbirini **entity** olarak güçlendirsin  

### D. Ölç → düzelt (iskelet sonrası)

- GA4: hangi landing ölüyor  
- Search Console: tıklama/gösterim (bağlanınca)  
- Dashboard önerisi: düşük sayfa → Ads veya içerik güçlendir  

---

## 6) Derin fikir envanteri (hafızaya alındı — ekstra fatura yok)

Bunlar iskelet/sonraki sprintler; çoğunun maliyeti **geliştirme zamanı**, Firebase faturası değil:

- Skor / öneri / yerel fırsat / sağlık (başladı)  
- Şablon üretici, duplicate uyarısı, yayınla, noindex anahtarı  
- İç link önerisi, cannibalization uyarısı  
- Schema önizleme, CSV toplu import, Eskişehir×hizmet matrisi  
- GA4 gerçek veri, Search Console köprüsü  
- Oturum timeout, 2FA, yedek+geri yükle, çöp kutusu  
- Domain/SSL/sitemap sağlık, (ileride) cache purge  
- Reklam adayı rozeti, İstiklal link kütüphanesi  
- Önce PWA admin, sonra Android  

**Bilinçli erteleme:** sınırsız AI oto-yayın, her pageview Firestore, gereksiz Storage görselleri, doorway kopyalar.

---

## 7) Net karar (bugün)

1. Admin iskeleti + kural tabanlı meta/skor ile devam.  
2. Ücretli AI’yi “süper SEO” sanma; **hız opsiyonu** olarak sonra.  
3. Asıl süper hamle: **az ama özgün yerel landing + İstiklal bağları + ölçüm**.  

Bu çerçeveye katılıyoruz; AI SEO dışında yol haritası net.
