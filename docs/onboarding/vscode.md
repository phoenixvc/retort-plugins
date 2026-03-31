# Retort — VS Code Extension

The VS Code extension surfaces Retort commands in the command palette,
a sidebar view, and a status bar widget. It activates automatically when
a `.agentkit/` directory is present at the workspace root.

## Requirements

- VS Code `^1.85.0`
- Retort installed in the project (`.agentkit/spec/project.yaml` must exist)

## Installation

### From the Marketplace (recommended)

1. Open VS Code.
2. Press `Ctrl+Shift+X` to open the Extensions panel.
3. Search for **Retort** (publisher: `phoenixvc`).
4. Click **Install**.

### Manual / dev install

```bash
cd extensions/vscode
pnpm install
pnpm run build        # compiles to out/extension.js
```

Then in VS Code: **Extensions → ⋯ → Install from VSIX...** and select
`extensions/vscode/retort-*.vsix` (produced by `pnpm run package`).

## Activation

The extension activates when VS Code opens a workspace that contains `.agentkit/`
at the root (`activationEvents: ["workspaceContains:.agentkit"]`). No manual
enable step is required.

## Available Commands

Open the Command Palette (`Ctrl+Shift+P`) and type **Retort** to see all commands:

| Command | Description |
|---------|-------------|
| `Retort: Sync Configs` | Regenerate AI tool configs from spec |
| `Retort: Run Check` | Lint + typecheck + tests |
| `Retort: Health Check` | Full repo health check |
| `Retort: Orchestrate` | Master coordinator — assess, plan, delegate |
| `Retort: Plan` | Structured implementation planning |
| `Retort: Discover` | Scan repo structure and tech stacks |
| `Retort: Validate` | Validate spec against schema |
| `Retort: Show Backlog` | Show consolidated backlog |
| `Retort: Handoff` | Generate session handoff document |
| `Retort: Preflight` | Pre-ship delivery checks |
| `Retort: Security Scan` | Security audit |
| `Retort: Project Status` | Unified PM dashboard |
| `Retort: Run Command...` | Choose and run any Retort command |

## Keyboard Shortcut

`Shift+Ctrl+Alt+R` — opens the **Run Command...** picker.

## Sidebar

The Retort sidebar view (Activity Bar icon) shows:

- Active orchestration phase
- In-progress tasks from `.claude/state/tasks/`
- Quick-launch buttons for common commands

## Status Bar

A status bar item on the right shows the active phase (e.g. `Retort: Implementation`).
Click it to open the command picker.

## Troubleshooting

**Extension not activating**
: Ensure `.agentkit/spec/project.yaml` exists. The extension only activates when
  `.agentkit/` is present at the workspace root — not in a subdirectory.

**Commands not found in terminal**
: The extension runs Retort in VS Code's integrated terminal. Ensure `pnpm` is
  on your `PATH`. Check `Extensions → Retort → Output` for error details.

**Sidebar is empty**
: Run `Retort: Sync Configs` once to generate state files. The sidebar reads
  `.claude/state/` which is created on first sync.
