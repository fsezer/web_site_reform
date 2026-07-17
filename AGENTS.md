# Sanas Website — Agent rules

Umbrella: `PROJECT/Sanas/`  
Website: `PROJECT/Sanas/sanas_website/`

Open Cursor via `../Sanas.code-workspace` (tek giriş: **Sanas**).

## Layout (zorunlu)

```text
Sanas/                              # tek workspace kökü
  Sanas.code-workspace              # Cursor’da adı: Sanas
  README.md                         # umbrella özeti
  sanas_website/                    # website
    README.md
    AGENTS.md
    docs/                           # + docs/archive/legacy (eski metinler)
    public/                         # + img/portal, img/kvkk
    src/css|js/
    *.html                          # + portal.html
```

## Kurallar

1. **README.md** ve **AGENTS.md** website için `sanas_website/` kökünde. `docs/` altına taşıma.
2. Uzun notlar → `sanas_website/docs/*.md`. `docs/README.md` indeks olsun.
3. Stack: **Vite + Tailwind v4 + vanilla JS**. Bootstrap / jQuery ekleme.
4. Database / backend yok (şimdilik). Portal sayfası: `/portal.html`.
5. Tasarım: marka önce, hero sade, jenerik UI kit görünümü yok.
6. Yeni iş yalnızca `sanas_website` içinde. Eski site arşivi: `docs/archive/legacy/` + `public/img/portal|kvkk`.
7. Yeni Sanas alt projeleri diskte `Sanas/` altına klasör olarak eklenir. Workspace’te ekstra `folders` root açma — solda tek **Sanas** kalsın.

## Komutlar

```bash
npm install
npm run dev
npm run build
```
