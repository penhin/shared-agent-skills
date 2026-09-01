# Shared Codex Skills

Cross-platform Codex skills for Windows and WSL.

## Install globally

Clone this repository, then run the setup script for the environment you use:

```powershell
./scripts/install-global.ps1
```

```bash
bash ./scripts/install-global.sh
```

The script links the repository's `.agents/skills` directory into the user-level
Codex skill directory, so the skills are available when Codex starts in any
repository.

The repository layout follows Codex's repository skill discovery convention:

```text
.agents/skills/<skill-name>/SKILL.md
```
