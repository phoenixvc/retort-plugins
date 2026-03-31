# Retort IDE Plugin — Onboarding Overview

Retort ships editor extensions for three IDEs. Each integrates with the
[Retort framework](https://github.com/phoenixvc/retort) running in your terminal,
surfacing commands, status, and (where supported) AI context injection directly
inside your editor.

| IDE | Extension | Status |
|-----|-----------|--------|
| [VS Code](vscode.md) | VSIX via Marketplace / manual | Available |
| [JetBrains](jetbrains.md) | Plugin via Marketplace / local install | Available |
| [Zed](zed.md) | Extension via Zed extension registry | Available |

## Prerequisites

All extensions require Retort to be installed in your project:

```bash
# Verify Retort is present
cat .agentkit/spec/project.yaml   # must exist
pnpm -C .agentkit retort:sync     # ensure generated files are up-to-date
```

The extension activates automatically when `.agentkit/` is detected at the
workspace root. No manual configuration is needed for basic usage.

## Common Features Across All IDEs

| Feature | VS Code | JetBrains | Zed |
|---------|---------|-----------|-----|
| Command palette | ✓ | ✓ | ✓ (slash commands) |
| Project tool window / sidebar | ✓ | ✓ | — |
| Status bar widget | ✓ | ✓ | — |
| Copy Workspace Context | ✓ | ✓ | — |
| AI context injection | ✓ `@retort` (Copilot Chat) | ✓ Junie (optional) | — |

## Quick Links

- [VS Code onboarding](vscode.md)
- [JetBrains onboarding](jetbrains.md) — covers PyCharm, IntelliJ IDEA, Rider
- [Zed onboarding](zed.md)
- [Junie integration details](jetbrains.md#junie-integration)
