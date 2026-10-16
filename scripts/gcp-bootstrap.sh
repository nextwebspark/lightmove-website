#!/usr/bin/env bash
#
# Everything on GCP that has to exist before the first release, in one idempotent script.
#
#   ./scripts/gcp-bootstrap.sh
#
# Committed and re-runnable so the deploy identity is a record, not a paragraph of commands someone once
# typed: anyone can read exactly which roles the deployer holds, and re-running it changes nothing.
#
# Needs gcloud logged in as a project owner. No service-account key is ever created.
set -euo pipefail

PROJECT="${GCP_PROJECT:-dograh-eu}"
REPO="${GITHUB_REPO:-nextwebspark/lightmove-website}"
SITE="$(node -p 'require("./firebase.json").hosting.site')"

DEPLOY_SA="lightmove-website-deployer"
POOL="github-pool"                    # shared with the other apps in this project
PROVIDER="lightmove-website-provider" # its own, pinned to this repository

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
DEPLOY_SA_EMAIL="${DEPLOY_SA}@${PROJECT}.iam.gserviceaccount.com"
PROVIDER_NAME="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"

say() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }

# Firebase has no gcloud surface, so its two calls go to the REST API with the caller's own token.
firebase_api() {
    local method="$1" url="$2"
    curl -sS -X "$method" "$url" \
        -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        -H "x-goog-user-project: ${PROJECT}" \
        -H 'Content-Type: application/json' \
        -w '\n%{http_code}' ${3:+-d "$3"}
}
status_of() { tail -n 1 <<<"$1"; }
body_of() { sed '$d' <<<"$1"; }

# ── APIs ──────────────────────────────────────────────────────────────────────
say "Enabling APIs"
gcloud services enable \
    firebase.googleapis.com firebasehosting.googleapis.com \
    iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
    --project="$PROJECT"

# ── Firebase and the Hosting site ─────────────────────────────────────────────
say "Firebase"
RESPONSE="$(firebase_api GET "https://firebase.googleapis.com/v1beta1/projects/${PROJECT}")"
if [ "$(status_of "$RESPONSE")" = 200 ]; then
    echo "  ✓ ${PROJECT} is a Firebase project"
else
    RESPONSE="$(firebase_api POST "https://firebase.googleapis.com/v1beta1/projects/${PROJECT}:addFirebase" '{}')"
    [ "$(status_of "$RESPONSE")" = 200 ] || { body_of "$RESPONSE"; exit 1; }
    OPERATION="$(body_of "$RESPONSE" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).name))')"
    until body_of "$(firebase_api GET "https://firebase.googleapis.com/v1beta1/${OPERATION}")" | grep -q '"done": true'; do
        sleep 3
    done
    echo "  ✓ added Firebase to ${PROJECT}"
fi

# A site of its own, so this website never shares a release history with anything else in the project.
RESPONSE="$(firebase_api GET "https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT}/sites/${SITE}")"
if [ "$(status_of "$RESPONSE")" = 200 ]; then
    echo "  ✓ Hosting site '${SITE}' exists"
else
    RESPONSE="$(firebase_api POST "https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT}/sites?siteId=${SITE}" '{}')"
    if [ "$(status_of "$RESPONSE")" != 200 ]; then
        body_of "$RESPONSE"
        echo "Site ids are global. If '${SITE}' is taken, change hosting.site in firebase.json and re-run." >&2
        exit 1
    fi
    echo "  ✓ created Hosting site '${SITE}' (https://${SITE}.web.app)"
fi

# ── Deploy service account ────────────────────────────────────────────────────
say "Deploy service account"
if gcloud iam service-accounts describe "$DEPLOY_SA_EMAIL" --project="$PROJECT" &>/dev/null; then
    echo "  ✓ ${DEPLOY_SA} exists"
else
    gcloud iam service-accounts create "$DEPLOY_SA" --project="$PROJECT" \
        --display-name="lightmove.ai deploys (lightmove-website)"
fi

# Hosting admin is the whole job. serviceUsageConsumer only lets firebase-tools confirm the Hosting API
# is enabled before it uploads; it cannot enable or disable anything.
for ROLE in roles/firebasehosting.admin roles/serviceusage.serviceUsageConsumer; do
    gcloud projects add-iam-policy-binding "$PROJECT" \
        --member="serviceAccount:${DEPLOY_SA_EMAIL}" --role="$ROLE" --condition=None --quiet >/dev/null
    echo "  ✓ deployer has ${ROLE}"
done

# ── Workload Identity Federation ──────────────────────────────────────────────
say "Workload Identity Federation"
if ! gcloud iam workload-identity-pools describe "$POOL" --location=global --project="$PROJECT" &>/dev/null; then
    gcloud iam workload-identity-pools create "$POOL" --location=global \
        --display-name="GitHub Actions" --project="$PROJECT"
fi

if gcloud iam workload-identity-pools providers describe "$PROVIDER" \
        --workload-identity-pool="$POOL" --location=global --project="$PROJECT" &>/dev/null; then
    echo "  ✓ provider '${PROVIDER}' exists"
else
    gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
        --workload-identity-pool="$POOL" --location=global --project="$PROJECT" \
        --display-name="lightmove.ai (lightmove-website)" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
        --attribute-condition="assertion.repository == '${REPO}'"
fi

# Only this repository may impersonate the deployer. Without the condition above AND this binding, any
# GitHub repository could mint a token for this pool.
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA_EMAIL" \
    --role=roles/iam.workloadIdentityUser --project="$PROJECT" --quiet \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${REPO}" >/dev/null
echo "  ✓ only ${REPO} may impersonate ${DEPLOY_SA}"

# ── What is left for a human ──────────────────────────────────────────────────
cat <<EOF

────────────────────────────────────────────────────────────────────────────────
Done. What remains is deliberately manual.

1. GitHub repository variables — identifiers, not secrets:

     gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --repo ${REPO} --body '${PROVIDER_NAME}'
     gh variable set GCP_SERVICE_ACCOUNT            --repo ${REPO} --body '${DEPLOY_SA_EMAIL}'
     gh variable set FIREBASE_PROJECT_ID            --repo ${REPO} --body '${PROJECT}'
     gh variable set PUBLIC_APP_URL                 --repo ${REPO} --body 'https://app.lightmove.ai'
     gh variable set PUBLIC_DEMO_AGENT_TOKEN        --repo ${REPO} --body '<the demo agent embed token>'

   Once lightmove.ai is connected (step 3), also:

     gh variable set PUBLIC_BASE_URL                --repo ${REPO} --body 'https://lightmove.ai'

2. Merge and release gates: ./scripts/github-protect.sh
   GitHub → Settings → Environments → production: deployment branches limited to 'main'.

3. Firebase console → Hosting → site '${SITE}' → Add custom domain: lightmove.ai, then www.lightmove.ai
   redirecting to it. Records in Cloudflare as DNS only (grey cloud).

Then ship: Actions → Release → Run workflow.
EOF
