# Sanas Website — Agent rules

Umbrella: `PROJECT/Sanas/`  
Website: `PROJECT/Sanas/sanas_website/`  
Mobile admin: `PROJECT/Sanas/sanas_mobile/` (ayrı Git deposu)

Open Cursor via `../Sanas.code-workspace` (tek giriş: **Sanas**).

## Layout (zorunlu)

```text
Sanas/                              # tek workspace kökü
  Sanas.code-workspace              # Cursor’da adı: Sanas
  README.md                         # umbrella özeti
  sanas_website/                    # website + Admin PWA
    README.md
    AGENTS.md
    docs/
    public/
    src/css|js/
    functions/ga4-report/           # Cloud Run: GA4 / SC / PSI
    *.html                          # + admin.html, login.html, portal.html
  sanas_mobile/                     # Flutter Admin (Android + iOS)
```

## Kurallar

1. **README.md** ve **AGENTS.md** website için `sanas_website/` kökünde. `docs/` altına taşıma.
2. Uzun notlar → `sanas_website/docs/*.md`. `docs/README.md` indeks olsun.
3. Stack: **Vite + Tailwind v4 + vanilla JS**. Bootstrap / jQuery ekleme.
4. Backend: Firebase Auth + Firestore (CMS/allowlist) + Cloud Run GA4/SC/PSI proxy. Public sitede hit yazılmaz; kaynak GA4.
5. Tasarım: marka önce, hero sade, jenerik UI kit görünümü yok.
6. Website işi `sanas_website/` içinde; mobil admin `sanas_mobile/` içinde. Eski site arşivi: `docs/archive/legacy/` + `public/img/portal|kvkk`.
7. Yeni Sanas alt projeleri diskte `Sanas/` altına klasör olarak eklenir. Workspace’te ekstra `folders` root açma — solda tek **Sanas** kalsın.

## Komutlar

```bash
npm install
npm run build
docker compose up -d --build   # local: http://localhost:5703
```
