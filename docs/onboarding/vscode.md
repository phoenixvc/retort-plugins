# Retort — VS Code Extension

The VS Code extension surfaces Retort commands in the command palette,
a sidebar view, and a status bar widget. It activates automatically when
a `.agentkit/` directory is present at the workspace root.

## Requirements

- VS Code `^1.90.0`
- Retort installed in the project (`.agentkit/spec/project.yaml` must exist)
- [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) (optional — required for `@retort` Copilot integration)

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
| `Retort: Copy Workspace Context` | Copy active phase, tasks, and teams to clipboard |

## Keyboard Shortcut

`Shift+Ctrl+Alt+R` (Windows/Linux) / `Shift+Cmd+Alt+R` (macOS) — opens the **Run Command...** picker.

## Sidebar

The Retort sidebar view (Activity Bar icon) shows:

- In-progress tasks from `.claude/state/tasks/`
- Agent team roster
- Quick-launch buttons for common commands

## Status Bar

Two items appear on the left of the status bar:

- `$(sync) Retort` — click to run Sync
- `$(milestone) Phase N` — shows the active orchestration phase; click to run Project Status

## Copilot Chat Integration

When GitHub Copilot Chat is installed, Retort registers as a `@retort` chat participant.
Use it directly in the Copilot Chat panel (`Ctrl+Alt+I`):

| Command | What it returns |
|---------|----------------|
| `@retort /status` | Active phase + in-progress tasks |
| `@retort /teams` | Full contents of your teams file |
| `@retort /backlog` | Contents of `AGENT_BACKLOG.md` |
| `@retort <question>` | Injects workspace context, then answers |

**Example:**
```
@retort /status
# → Active phase: Implementation
#   In-progress tasks:
#   - feat(auth): add OAuth2 login flow
#   Retort teams file: `teams.yaml`

@retort which team should handle the payment endpoint?
# → injects context above, Copilot answers based on your team roster
```

If Copilot Chat is not installed the `@retort` participant is unavailable, but
all other extension features (commands, sidebar, status bar) work normally.

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
