#!/bin/bash
set -euo pipefail

LIMIT=${PR_HARD_LIMIT:-800}

git fetch --quiet origin main
BASE=$(git merge-base HEAD origin/main)
LINES=$(git diff --shortstat "$BASE" -- \
    ':!package-lock.json' ':!yarn.lock' ':!pnpm-lock.yaml' \
    ':!*.generated.*' ':!*.snap' \
  | awk '{ for (i=1;i<=NF;i++) if ($i ~ /insertion|deletion/) s+=$(i-1) } END { print s+0 }')

if [ "$LINES" -gt "$LIMIT" ]; then
  jq -n --arg r "PR is $LINES lines (limit $LIMIT). Split into smaller PRs before creating." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse", permissionDecision:"deny", permissionDecisionReason:$r}}'
fi
exit 0
