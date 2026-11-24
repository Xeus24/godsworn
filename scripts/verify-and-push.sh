#!/usr/bin/env bash
# The full check before a batch is committed: regenerated docs, browser tests with the fold audit,
# type-check, unit tests, build and the full playtest. Commits everything and pushes `main` only if all pass.
# Takes about 12 minutes: run it in the background, and do not edit files while it runs (it uses `git add -A`).
#
# Usage: scripts/verify-and-push.sh <commit-message-file> [log-dir]
set -u
MSG="${1:?usage: scripts/verify-and-push.sh <commit-message-file> [log-dir]}"
LOGS="${2:-$(mktemp -d)}"
cd "$(dirname "$0")/.."
mkdir -p "$LOGS"
[ -f "$MSG" ] || { echo "No commit message file: $MSG"; exit 2; }

npm run content:md >/dev/null 2>&1
npx tsx scripts/lockStrings.ts >/dev/null 2>&1

# Browser tests. The fold audit is built in: a step that relies on a folded panel happening to be open fails its test.
npm run test:e2e > "$LOGS/e2e.log" 2>&1; E=$?
grep -E "passed|failed" "$LOGS/e2e.log" | tail -3

npx tsc --noEmit -p . > "$LOGS/tsc.log" 2>&1; T=$?
npx vitest run > "$LOGS/vitest.log" 2>&1
V=$(grep -c " failed" "$LOGS/vitest.log")
grep -E "Tests " "$LOGS/vitest.log"

npm run build > "$LOGS/build.log" 2>&1; B=$?

npm run playtest -- ng > "$LOGS/playtest.log" 2>&1
F=$(grep -c "finished" "$LOGS/playtest.log")
S=$(grep -c "stalled" "$LOGS/playtest.log")

echo "e2e=$E tsc=$T vitest_failed_lines=$V build=$B finished=$F stalled=$S logs=$LOGS"
if [ "$E" = "0" ] && [ "$T" = "0" ] && [ "$V" = "0" ] && [ "$B" = "0" ] && [ "$S" = "0" ] && [ "$F" -ge 96 ]; then
  git add -A
  if git diff --cached --quiet; then
    echo "ALL CHECKS PASSED. Nothing to commit."
  else
    git commit -q -F "$MSG" && git push -q origin main && git log --oneline -1 && echo PUSHED
  fi
else
  echo "NOT COMMITTED"
  exit 1
fi
