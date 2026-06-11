---
name: lazyweb-update
route: 'Updating local Lazyweb skills, reinstalling Lazyweb, or syncing Lazyweb into agentic IDEs'
description: |
  Update the local Lazyweb skill pack from GitHub and reinstall Lazyweb skills
  into supported local coding clients and agentic IDEs. Use when the user asks
  to update Lazyweb, refresh stale Lazyweb slash commands, sync local skills,
  reinstall the skill pack, or make Codex/Claude/Cursor/OpenCode/Kiro/Factory/
  Slate/Hermes pick up the latest Lazyweb skills.
allowed-tools:
  - Bash
  - Read
  - Grep
---

# Lazyweb Update

Use this skill for maintenance only: update the installed Lazyweb skill pack,
reinstall the local skills, and verify the active clients can see the result.
Do not run design research from here.

## Run the update

Use the bundled updater when available:

```bash
"$HOME/.lazyweb/bin/lazyweb-update" --host all --quiet
```

Use `--host auto` only when the user explicitly wants detected clients instead
of every supported local skill root.

If that file is missing because the install is old, bootstrap once from GitHub:

```bash
set -euo pipefail
REPO="${LAZYWEB_SKILL_REPO:-https://github.com/aboul3ata/lazyweb-skill}"
TARGET="${LAZYWEB_SKILL_DIR:-$HOME/.lazyweb/repos/lazyweb-skill}"
mkdir -p "$(dirname "$TARGET")"
if [ -d "$TARGET/.git" ]; then
  git -C "$TARGET" pull --ff-only
else
  rm -rf "$TARGET"
  git clone --depth 1 "$REPO" "$TARGET"
fi
"$TARGET/setup" --host all --quiet
```

The public installer remains:

```bash
curl -fsSL https://www.lazyweb.com/install.sh | bash
```

But for this skill, prefer the commands above because they explicitly reinstall
every supported local skill root with `--host all`.

## Verify

After the updater finishes:

1. Print the before and after git commit for
   `~/.lazyweb/repos/lazyweb-skill` when available.
2. Check that `lazyweb-update/SKILL.md` exists under any detected local skill
   roots, especially `~/.codex/skills` and `~/.claude/skills`.
3. Run `~/.lazyweb/bin/lazyweb-update-check`; it should print nothing when the
   installed version is current.
4. If Lazyweb MCP tools are available in the current client, run
   `lazyweb_health`. If the current session cannot see MCP tools or newly
   installed skills, tell the user to reload or restart the client; local skill
   discovery is not always hot-loaded.

Summarize the updated commit/version, which clients were refreshed, and any
client that needs a restart.
