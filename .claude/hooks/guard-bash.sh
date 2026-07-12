#!/usr/bin/env bash
# PreToolUse(Bash) guard.
#
# Blocks two classes of command that are easy to run from muscle memory and
# expensive to undo in this repo:
#
#   1. npm — the lockfile is yarn.lock (Yarn Classic). An `npm install` ignores
#      it, resolves a different dependency tree, and drops a competing
#      package-lock.json.
#
#   2. Bulk git staging (`git add -A`, `git add .`, `git commit -a`) — this repo
#      is public, and the working tree holds local-only files that must never be
#      committed: a real .env, editor droppings, scratch notes. Bulk staging is
#      exactly how one of them gets swept in. Stage by explicit path.
#
# Deny is emitted as JSON on exit 0 so the reason reaches Claude verbatim.

set -euo pipefail

input=$(cat)
command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

[ -z "$command" ] && exit 0

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# --- Sanitize before matching --------------------------------------------
# Only *commands* are inspected, never data that merely travels inside one.
# Without this, writing a commit message that mentions npm or `git add -A` —
# which the docs in this repo do, constantly — trips the guard against itself.
#
#   1. Drop heredoc bodies: `git commit -F - <<'EOF' ... EOF` carries prose.
#   2. Drop quoted strings: `git commit -m "fix the -a flag"` is not the -a flag.
clean=$(printf '%s' "$command" | awk '
  {
    if (skip) { if ($0 == delim) skip = 0; next }
    if (match($0, /<<-?[ ]*['"'"'"]?[A-Za-z_][A-Za-z0-9_]*['"'"'"]?/)) {
      d = substr($0, RSTART, RLENGTH)
      sub(/^<<-?[ ]*['"'"'"]?/, "", d)
      sub(/['"'"'"]$/, "", d)
      delim = d; skip = 1
    }
    print
  }' | sed "s/'[^']*'//g; s/\"[^\"]*\"//g")

# --- 1. npm ---------------------------------------------------------------
# npm must sit at a command position — start of a line, or after ; && || | —
# so the word appearing in prose or a path (npm-shrinkwrap.json) is not a hit.
if printf '%s' "$clean" | grep -qE '(^|[;&|])[[:space:]]*npm([[:space:]]|$)'; then
  deny "This project uses yarn (Classic v1) — yarn.lock is the committed lockfile and there is no package-lock.json. An npm install would ignore yarn.lock and resolve a different dependency tree. Use: yarn add <pkg>, yarn add -D <pkg>, or yarn install --frozen-lockfile. See CLAUDE.md."
fi

# --- 2. bulk git staging --------------------------------------------------
if printf '%s' "$clean" | grep -qE 'git[[:space:]]+add[[:space:]]+(-A|--all|\.)([[:space:]]|$)'; then
  deny "Bulk staging is blocked in this repo. It is public, and the working tree holds local-only files that must never be committed. Stage by explicit path instead: git add <file> <file>. Then verify with: git diff --cached --name-only"
fi

# Catches -a and combined clusters like -am. Not --amend: the alternation needs a
# single leading dash preceded by whitespace or start.
if printf '%s' "$clean" | grep -qE 'git[[:space:]]+commit' &&
  printf '%s' "$clean" | grep -qE '(^|[[:space:]])(-[a-zA-Z]*a[a-zA-Z]*|--all)([[:space:]]|$)'; then
  deny "git commit -a / -am stages every tracked change without review. This repo is public — stage by explicit path first (git add <file>), then commit. See CLAUDE.md."
fi

exit 0
