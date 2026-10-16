#!/usr/bin/env bash
#
# The merge and release gates as GitHub rulesets, in one idempotent script:
#
#   ./scripts/github-protect.sh
#
# - main: changes only through a pull request, with the CI check green on an up-to-date branch and
#   every review thread resolved; no force-pushes, no deletion.
# - v* tags: once Release cuts a version it can never be moved or deleted, so a rollback always
#   deploys exactly what shipped.
#
# Needs the gh CLI logged in as a repository admin. Rulesets on private repositories need a paid plan.
set -euo pipefail

REPO="${GITHUB_REPO:-nextwebspark/lightmove-website}"
CI_CHECK="Lint, check, test, build, Lighthouse"

upsert_ruleset() {
    local name="$1" body="$2"
    local id
    id="$(gh api "repos/${REPO}/rulesets" --jq ".[] | select(.name == \"${name}\") | .id" || true)"
    if [ -n "$id" ]; then
        gh api -X PUT "repos/${REPO}/rulesets/${id}" --input - <<<"$body" >/dev/null
        echo "  ✓ updated ruleset '${name}'"
    else
        gh api -X POST "repos/${REPO}/rulesets" --input - <<<"$body" >/dev/null
        echo "  ✓ created ruleset '${name}'"
    fi
}

upsert_ruleset "main: pull requests with green CI" "$(cat <<JSON
{
  "name": "main: pull requests with green CI",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [{ "context": "${CI_CHECK}" }]
      }
    }
  ]
}
JSON
)"

upsert_ruleset "release tags are immutable" "$(cat <<'JSON'
{
  "name": "release tags are immutable",
  "target": "tag",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/tags/v*"], "exclude": [] } },
  "rules": [{ "type": "update" }, { "type": "deletion" }, { "type": "non_fast_forward" }]
}
JSON
)"

echo
echo "Done. Pull requests into main now need '${CI_CHECK}' to pass before they can merge."
echo "Raise required_approving_review_count once there is a second maintainer to review."
