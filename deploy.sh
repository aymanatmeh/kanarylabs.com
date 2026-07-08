#!/usr/bin/env bash
# Deploy the KanaryLabs site to Cloudflare (Workers Static Assets).
#
# Usage:
#   ./deploy.sh          # build + deploy to production
#
# Config lives in wrangler.jsonc (project name, account, assets dir).
#
# Prereqs (one-time):
#   npx wrangler login          # must be the ayman.atmeh@gmail.com account
#   npx wrangler whoami         # confirm the account ID below is listed

set -euo pipefail

# Cloudflare account that owns the "kanarylabs" project (matches wrangler.jsonc).
ACCOUNT_ID="6c6d05ee939be8c3e4799e2a0a570658"

# Run from the script's own directory so it works from anywhere.
cd "$(dirname "$0")"

echo "▸ Verifying Cloudflare login…"
if ! npx --yes wrangler@latest whoami 2>/dev/null | grep -q "$ACCOUNT_ID"; then
  echo "✗ Not logged into the correct Cloudflare account ($ACCOUNT_ID)."
  echo "  Run:  npx wrangler login   (as ayman.atmeh@gmail.com), then retry."
  exit 1
fi

echo "▸ Building…"
npm run build

echo "▸ Deploying…"
npx --yes wrangler@latest deploy

echo "✓ Done."
