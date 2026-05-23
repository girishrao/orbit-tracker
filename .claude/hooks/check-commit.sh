#!/bin/bash
set -euo pipefail

LIMIT=${COMMIT_HARD_LIMIT:-200}

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# Decide which diff to measure based on the commit flags:
#   --amend         : the resulting commit vs its parent (HEAD~1)
#   -a / --all      : staged + unstaged tracked changes vs HEAD
#   default         : staged vs HEAD
# The -a regex matches any short-flag cluster containing 'a', e.g. -a, -am, -vam.
if echo "$COMMAND" | grep -q -- '--amend'; then
  DIFF_ARGS=(--cached HEAD~1)
elif echo "$COMMAND" | grep -qE '(^|[[:space:]])(-[a-zA-Z]*a[a-zA-Z]*|--all)([[:space:]]|$)'; then
  DIFF_ARGS=(HEAD)
else
  DIFF_ARGS=(--cached HEAD)
fi

LINES=$(git diff --shortstat "${DIFF_ARGS[@]}" -- \
    ':!package-lock.json' ':!yarn.lock' ':!pnpm-lock.yaml' \
    ':!*.generated.*' ':!*.snap' \
  | awk '{ for (i=1;i<=NF;i++) if ($i ~ /insertion|deletion/) s+=$(i-1) } END { print s+0 }')

if [ "$LINES" -gt "$LIMIT" ]; then
  jq -n --arg r "Commit is $LINES lines (limit $LIMIT). Split into smaller logical commits. Reviewers read commit-by-commit; several ${LIMIT}-line commits with clear messages are far easier to review than one ${LINES}-line commit." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse", permissionDecision:"deny", permissionDecisionReason:$r}}'
fi
exit 0
