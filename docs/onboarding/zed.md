# Retort — Zed Extension

The Zed extension adds Retort slash commands to Zed's AI assistant panel.
It is implemented as a Rust `slash_command` extension.

## Requirements

- [Zed](https://zed.dev) stable or nightly
- Retort installed in the project (`.agentkit/spec/project.yaml` must exist)
- Rust toolchain (for building from source only)

## Installation

### From the Zed Extension Registry (recommended)

1. Open Zed.
2. Press `Cmd+Shift+X` (macOS) / `Ctrl+Shift+X` (Linux) to open extensions.
3. Search for **Retort**.
4. Click **Install**.

### Manual / dev install

```bash
cd extensions/zed
cargo build --release
```

Then in Zed: **Extensions → Install Dev Extension** and point to the
`extensions/zed` directory.

## Available Slash Commands

Type `/` in the Zed AI assistant panel to see the Retort commands:

| Command | Description |
|---------|-------------|
| `/retort-status` | Show active Retort agents and task status |
| `/retort-teams` | List Retort agent teams |
| `/retort-backlog` | Show open Retort backlog items |
| `/retort-sync` | Instructions to run `retort sync` |

## Usage Example

```
/retort-status
# → Returns current phase, in-progress tasks, and team roster

/retort-teams
# → Lists all configured agent teams with their scope

/retort-backlog
# → Shows open items from AGENT_BACKLOG.md
```

## Limitations

Compared to the VS Code and JetBrains extensions, the Zed extension is
intentionally minimal — Zed's extension API currently supports slash commands
only. There is no sidebar panel or status bar widget.

As Zed's extension API matures, additional surface areas (status bar, sidebar)
will be added.

## Troubleshooting

**Commands not appearing**
: Ensure the extension is installed and Zed has been restarted. Slash commands
  appear only when the AI assistant panel is open (`Cmd+?` or **View → AI Assistant**).

**`cargo build` fails**
: Ensure Rust stable is installed (`rustup update stable`). The extension uses
  the `zed_extension_api` crate — check `Cargo.toml` for the pinned version.

**Output is empty**
: The extension reads `.claude/state/` files. Run `retort sync` in the terminal
  first to generate state files, then retry the slash command.
