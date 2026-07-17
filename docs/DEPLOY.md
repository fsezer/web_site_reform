# Deploy notları

Hedef (plan): site **Cloud Run**, DNS ileride **Cloudflare** (Free mümkün).

## Build

```bash
npm run build
```

Çıktı: `dist/` (statik).

## Docker (lokal)

Compose proje adı: **Sanas** (`docker-compose.yml` → `name: Sanas`).

```bash
# Build + çalıştır (http://localhost:5703)
docker compose up --build -d

# Durdur
docker compose down
```

- Image: `sanas-website:local`
- Container: `sanas-website`
- Lokal host port: **5703** → container **8080** (Cloud Run varsayılanı)

## Cloud Run (prod)

- Proje: `sanas-502703`
- Servis: `sanas-website`
- Bölge (domain mapping): **`europe-west1`** (`europe-west3` domain mapping desteklemiyor)
- Run URL: https://sanas-website-wvttiiwxxa-ew.a.run.app
- Custom domain: `sanastechnology.com` + `www.sanastechnology.com`
- Image: `europe-west3-docker.pkg.dev/sanas-502703/sanas/sanas-website:latest`

Mac (Apple Silicon) → Cloud Run için **amd64** build şart:

```bash
IMAGE=europe-west3-docker.pkg.dev/sanas-502703/sanas/sanas-website:latest
docker build --platform linux/amd64 -t "$IMAGE" .
docker push "$IMAGE"
gcloud run deploy sanas-website \
  --image="$IMAGE" \
  --region=europe-west1 \
  --project=sanas-502703 \
  --allow-unauthenticated \
  --port=8080 \
  --min-instances=0 \
  --max-instances=3 \
  --memory=256Mi \
  --cpu=1
```

## Cloudflare

- Zone: `sanastechnology.com` (Active)
- NS: `angela.ns.cloudflare.com` / `yadiel.ns.cloudflare.com` (ihs’te ayarlı)
- DNS: Cloud Run A/AAAA + `www` → `ghs.googlehosted.com` (şimdilik DNS-only / gri bulut; sertifika bitsin)
- Email Routing: `destek@` + `info@` → `fsezer.mail@gmail.com`
- SSL: Full; Always HTTPS on (Cloud Run sertifikası DNS sonrası oluşur)
