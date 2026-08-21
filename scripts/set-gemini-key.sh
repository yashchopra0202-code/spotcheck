#!/usr/bin/env bash
# Securely replace GEMINI_API_KEY in .env.local.
# Prompts with hidden input so the key is never echoed to the terminal or chat,
# and never prints the value back. .env.local is gitignored, so it is not committed.
set -euo pipefail
cd "$(dirname "$0")/.."

printf 'Paste the NEW Gemini API key (input hidden), then press Enter: '
read -rs KEY
echo
if [ -z "${KEY:-}" ]; then
  echo "No key entered — aborting, nothing changed."
  exit 1
fi

touch .env.local
# Keep every other line as-is; drop any existing GEMINI_API_KEY line; append the new one.
grep -v '^GEMINI_API_KEY=' .env.local > .env.local.tmp || true
printf 'GEMINI_API_KEY=%s\n' "$KEY" >> .env.local.tmp
mv .env.local.tmp .env.local
unset KEY

echo "✅ GEMINI_API_KEY updated in .env.local (value not printed)."
echo "   Restart the dev server for it to take effect."
