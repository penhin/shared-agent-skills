# Shared Agent Skills

Cross-platform skills shared by Codex, Pi, Claude Code, and other coding agents.

## Install globally

Clone this repository, then run the setup script for the environment you use:

```powershell
./scripts/install-global.ps1
```

```bash
bash ./scripts/install-global.sh
```

Use `-Force` or `--force` only when replacing an existing global skill link.

The script links the repository's `.agents/skills` directory into the user-level
skill directory used by Codex. Other agents can consume the same source through
their own global skill-directory configuration.

The repository layout follows the Agent Skills convention:

```text
.agents/skills/<skill-name>/SKILL.md
```
