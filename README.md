# retort-plugins

IDE plugins for the [Retort](https://github.com/phoenixvc/retort) framework.

## What is Retort?

Every AI coding assistant has its own config format — `CLAUDE.md`, `.cursor/rules/`, `.windsurf/rules/`, `.junie/guidelines.md`, `AGENTS.md`, and more. Keeping them in sync by hand means duplicated effort and drift.

**Retort** solves this: describe your project once in YAML, run `retort sync`, and get correct, project-aware configs for all 16 supported AI tools — automatically, on every sync.

```
.agentkit/spec/project.yaml   ← describe your project once
.agentkit/spec/teams.yaml     ← agent teams and their scopes
.agentkit/spec/rules.yaml     ← coding rules by domain
          ↓
      retort sync
          ↓
CLAUDE.md  .claude/  .cursor/  .windsurf/  .junie/  AGENTS.md  ...
```

These plugins bring Retort into your IDE — so you can trigger syncs, run quality gates, check orchestration status, and ask your AI assistant about the active team and tasks, all without leaving your editor.

## Extensions

| Extension | IDE | AI Integration |
|-----------|-----|----------------|
| [`extensions/vscode`](extensions/vscode/) | VS Code 1.90+ | `@retort` Copilot Chat participant |
| [`extensions/pycharm`](extensions/pycharm/) | PyCharm · IntelliJ IDEA · Rider 2023.3+ | Junie context injection (optional) |
| [`extensions/zed`](extensions/zed/) | Zed | `/retort-*` slash commands |

All three activate automatically when `.agentkit/` is present at the workspace root.

### What you get in each IDE

**VS Code**
- Command palette: `Ctrl+Shift+P` → `Retort: ...` (Sync, Check, Orchestrate, Plan, …)
- Sidebar dashboard: in-progress tasks, team roster, quick-launch buttons
- Status bar: active phase + sync shortcut
- `@retort` in Copilot Chat: `/status`, `/teams`, `/backlog` — workspace context injected automatically

**JetBrains (PyCharm / IntelliJ / Rider)**
- **Tools → Retort** menu with all commands
- Tool window: phase, tasks, quick-launch grid, **Copy Workspace Context** button
- Status bar widget
- Junie integration pre-wired — activates once JetBrains publishes the stable context API

**Zed**
- `/retort-status`, `/retort-teams`, `/retort-backlog`, `/retort-sync` in the AI assistant panel

## Getting Started

See [`docs/onboarding/`](docs/onboarding/) for per-IDE install and usage guides:

- [VS Code](docs/onboarding/vscode.md)
- [JetBrains](docs/onboarding/jetbrains.md)
- [Zed](docs/onboarding/zed.md)

> **New to Retort?** Start with the [Retort repo](https://github.com/phoenixvc/retort) —
> run `npx retort init` in your project first, then install the plugin for your IDE.

## Internal Packages

The VS Code extension is built on three shared packages:

| Package | Description |
|---------|-------------|
| [`packages/state-watcher`](packages/state-watcher/) | WebSocket daemon — watches `.claude/state/` and `.agentkit/` files, streams live state to the extension |
| [`packages/router`](packages/router/) | Keyword-based team/agent routing — powers natural-language questions about agent teams |
| [`packages/ui`](packages/ui/) | React webview — the sidebar dashboard rendered inside VS Code |

## Development

### Prerequisites

| Stack | Required for |
|-------|-------------|
| Node.js 20+, npm | VS Code extension + shared packages |
| JDK 17+, Gradle | JetBrains plugin |
| Rust stable | Zed extension |

### Build

```bash
# VS Code extension + all shared packages
npm install
npm run build

# JetBrains plugin
cd extensions/pycharm
./gradlew buildPlugin          # → build/distributions/retort-*.zip
./gradlew runIde               # launch a sandboxed IDE with the plugin loaded

# Zed extension
cd extensions/zed
cargo build --release
```

### Lint and typecheck

```bash
npm run lint
npm run typecheck
```

## Repo Structure

```
retort-plugins/
├── extensions/
│   ├── pycharm/          # JetBrains plugin (Kotlin + Gradle)
│   ├── vscode/           # VS Code extension (TypeScript)
│   └── zed/              # Zed extension (Rust)
├── packages/
│   ├── state-watcher/    # File-watch WebSocket daemon
│   ├── router/           # Team routing logic
│   └── ui/               # React sidebar webview
└── docs/
    └── onboarding/       # Per-IDE install and usage guides
```

## Contributing

PRs target `main`. Titles must follow [Conventional Commits](https://www.conventionalcommits.org/) — CI enforces this.

## License

MIT
