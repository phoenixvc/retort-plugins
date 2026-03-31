# retort-plugins

IDE plugins for the [Retort](https://github.com/phoenixvc/retort) framework — command palette, sidebar, status bar, and AI context injection across VS Code, JetBrains, and Zed.

## Extensions

| Extension | IDE | AI Integration |
|-----------|-----|----------------|
| [`extensions/vscode`](extensions/vscode/) | VS Code 1.90+ | `@retort` Copilot Chat participant |
| [`extensions/pycharm`](extensions/pycharm/) | PyCharm, IntelliJ IDEA, Rider 2023.3+ | Junie (optional, pre-wired) |
| [`extensions/zed`](extensions/zed/) | Zed | `/retort-*` slash commands |

All three extensions activate automatically when a `.agentkit/` directory is present at the workspace root.

## Packages

Internal shared packages consumed by the VS Code extension:

| Package | Description |
|---------|-------------|
| [`packages/state-watcher`](packages/state-watcher/) | WebSocket daemon — watches `.claude/state/` and `.agentkit/` files, streams state to the extension |
| [`packages/router`](packages/router/) | Keyword-based team/agent routing — answers natural-language questions about agent teams |
| [`packages/ui`](packages/ui/) | React webview — sidebar dashboard rendered inside VS Code |

## Getting Started

See [`docs/onboarding/`](docs/onboarding/) for per-IDE install and usage guides:

- [VS Code](docs/onboarding/vscode.md)
- [JetBrains](docs/onboarding/jetbrains.md) — PyCharm, IntelliJ IDEA, Rider
- [Zed](docs/onboarding/zed.md)

## Development

### Prerequisites

- Node.js 20+, npm (VS Code extension and shared packages)
- JDK 17+, Gradle (JetBrains plugin)
- Rust stable (Zed extension)

### Build all JS packages and the VS Code extension

```bash
npm install
npm run build
```

### Build the JetBrains plugin

```bash
cd extensions/pycharm
./gradlew buildPlugin
# output: build/distributions/retort-*.zip
```

Run in a sandboxed IDE:

```bash
./gradlew runIde
```

### Build the Zed extension

```bash
cd extensions/zed
cargo build --release
```

### Lint and typecheck (JS)

```bash
npm run lint
npm run typecheck
```

## Repo Structure

```
retort-plugins/
├── extensions/
│   ├── pycharm/          # JetBrains plugin (Kotlin/Gradle)
│   ├── vscode/           # VS Code extension (TypeScript)
│   └── zed/              # Zed extension (Rust)
├── packages/
│   ├── router/           # Team routing logic
│   ├── state-watcher/    # File-watch daemon
│   └── ui/               # React sidebar
└── docs/
    └── onboarding/       # Per-IDE install guides
```

## Contributing

PRs target `main`. Conventional Commits required — CI enforces the title format.

## License

MIT
