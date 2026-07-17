# Sanas Website

Sanas Technology kurumsal sitesi. **Vite + Tailwind CSS v4**, veritabanı yok, çok sayfalı statik site.

Eski `sanas_technology_website` silindi. Metin/görsel arşivi: `docs/archive/legacy/`, `public/img/portal/`, `public/img/kvkk/`.

## Lokal

```bash
npm install
npm run dev
```

http://localhost:5703

```bash
npm run build    # → dist/
npm run preview
```

## Sayfalar

| Dosya | Açıklama |
|-------|----------|
| `index.html` | Ana sayfa / portal CTA |
| `about.html` | Kuruluş / vizyon / misyon |
| `introducing.html` | Çalışma alanları |
| `contact.html` | İletişim |
| `portal.html` | Sanas Web portal |

## Dokümantasyon

| Konu | Dosya |
|------|-------|
| Agent kuralları | [AGENTS.md](AGENTS.md) |
| Workspace düzeni | [docs/README.md](docs/README.md) |
| Legacy kaynak | [docs/LEGACY.md](docs/LEGACY.md) |
| Deploy notları | [docs/DEPLOY.md](docs/DEPLOY.md) |

## Cursor

```bash
cursor ../Sanas.code-workspace
```

Solda tek giriş: **Sanas**. `sanas_website` alt klasör.
