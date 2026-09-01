#!/usr/bin/env bash
set -euo pipefail

skill_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.agents/skills" && pwd -P)"
global_root="$HOME/.agents/skills"
force="${1:-}"

mkdir -p "$(dirname "$global_root")"
if [ -e "$global_root" ] || [ -L "$global_root" ]; then
  if [ "$force" != "--force" ]; then
    printf '%s already exists. Remove it or rerun with --force.\n' "$global_root" >&2
    exit 1
  fi
  rm -rf "$global_root"
fi
ln -s "$skill_root" "$global_root"
printf 'Global skills installed at %s -> %s\n' "$global_root" "$skill_root"
