# GA4 Data API köprüsü (Cloud Run)

Service: `sanas-ga4-api`  
URL: `https://sanas-ga4-api-614342760473.europe-west1.run.app`  
SA: `ga4-reader@sanas-502703.iam.gserviceaccount.com`

## Deploy

```bash
cd functions/ga4-report
npm install
IMAGE=europe-west3-docker.pkg.dev/sanas-502703/sanas/sanas-ga4-api:latest
docker build --platform linux/amd64 -t "$IMAGE" .
docker push "$IMAGE"
gcloud run deploy sanas-ga4-api \
  --image="$IMAGE" \
  --region=europe-west1 \
  --project=sanas-502703 \
  --allow-unauthenticated \
  --service-account=ga4-reader@sanas-502703.iam.gserviceaccount.com \
  --set-env-vars=GA4_PROPERTY_ID=546157474,PSI_API_KEY=REPLACE_ME \
  --port=8080
```

Endpoints:
- `GET /ga4?days=7` — GA4 path views (Bearer Firebase ID token)
- `GET /sc?days=7` — Search Console queries
- `GET /psi?url=https://www.sanastechnology.com/&strategy=mobile` — PageSpeed (auth + server key)

HTTP açık; içeride Firebase ID token + allowlist doğrulanır.

## GA4 erişimi (zorunlu, bir kez)

1. [GA4 Admin](https://analytics.google.com/) → Property access management  
2. Kullanıcı ekle: `ga4-reader@sanas-502703.iam.gserviceaccount.com`  
3. Rol: **Viewer**

Sonra Admin → Analiz → **GA4’ten çek**.
