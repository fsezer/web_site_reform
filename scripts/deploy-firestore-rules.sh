#!/usr/bin/env bash
# Firestore rules deploy (gcloud token + Firebaserules API).
# Kullanım: ./scripts/deploy-firestore-rules.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT=sanas-502703
TOKEN=$(gcloud auth print-access-token)

python3 -c 'import json; print(json.dumps({"source":{"files":[{"name":"firestore.rules","content":open("firestore.rules").read()}]}}))' > /tmp/sanas-ruleset-body.json

curl -sS -X POST \
  "https://firebaserules.googleapis.com/v1/projects/${PROJECT}/rulesets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/sanas-ruleset-body.json \
  -o /tmp/sanas-ruleset-create.json

RULESET=$(python3 - <<'PY'
import re
raw = open("/tmp/sanas-ruleset-create.json", "rb").read().decode("utf-8", "replace")
m = re.search(r'"name"\s*:\s*"(projects/[^"]+/rulesets/[^"]+)"', raw)
if not m:
    raise SystemExit(raw[:800])
print(m.group(1))
PY
)
echo "ruleset=$RULESET"

# API, gövdede UpdateReleaseRequest sarmalayıcısı ister (düz Release kabul etmez).
python3 -c "import json,sys; print(json.dumps({'release':{'name':f'projects/{sys.argv[1]}/releases/cloud.firestore','rulesetName':sys.argv[2]},'updateMask':'rulesetName'}))" \
  "$PROJECT" "$RULESET" > /tmp/sanas-release-body.json

curl -sS -X PATCH \
  "https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases/cloud.firestore" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/sanas-release-body.json \
  -o /tmp/sanas-ruleset-release.json

python3 - <<'PY'
raw = open("/tmp/sanas-ruleset-release.json", "rb").read().decode("utf-8", "replace")
print(raw[:500])
if '"error"' in raw:
    raise SystemExit(1)
print("DEPLOY_OK")
PY

rm -f /tmp/sanas-ruleset-body.json /tmp/sanas-release-body.json
