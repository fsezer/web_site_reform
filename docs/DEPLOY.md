# Deploy notları

Hedef (plan): site **Cloud Run**, DNS ileride **Cloudflare** (Free mümkün).

## Build

```bash
npm run build
```

Çıktı: `dist/` (statik).

## Cloud Run (özet)

Statik `dist/` için hafif container (ör. `nginx` veya `caddy`) gerekir. Dockerfile henüz eklenmedi — deploy aşamasında yazılacak.

## Cloudflare

Domain kaydı şimdilik ihs’te kalabilir; yalnızca nameserver → Cloudflare Free yeterli. Proxy (turuncu bulut) + Full (strict) SSL önerilir.
