# Retort — JetBrains Plugin

The JetBrains plugin works across PyCharm, IntelliJ IDEA, Rider, and any
other IDE built on the IntelliJ platform (build 233+). It provides a command
palette, project tool window, and status bar widget. Optionally, when the
[Junie](https://www.jetbrains.com/junie/) AI plugin is installed, Retort
injects active team and task context into every Junie AI session.

## Requirements

- IntelliJ-based IDE build `233` or later (2023.3+), up to `251.*`
  - PyCharm 2023.3+
  - IntelliJ IDEA 2023.3+
  - Rider 2023.3+
- Retort installed in the project (`.agentkit/spec/project.yaml` must exist)
- Gradle / JDK 17+ (for building from source only)

## Installation

### From JetBrains Marketplace (recommended)

1. Open your IDE.
2. Go to **Settings → Plugins → Marketplace**.
3. Search for **Retort**.
4. Click **Install** and restart the IDE when prompted.

### Manual / dev install

```bash
cd extensions/pycharm
./gradlew buildPlugin          # produces build/distributions/retort-*.zip
```

Then in the IDE: **Settings → Plugins → ⚙ → Install Plugin from Disk…** and
select the generated `.zip`.

### Building and running in a sandbox IDE

```bash
cd extensions/pycharm
./gradlew runIde               # launches a sandboxed IDE with the plugin pre-installed
```

## Activation

The plugin activates for any project that contains `.agentkit/` at its root.
No manual configuration is required.

## Available Commands

Access via **Tools → Retort** in the menu bar, or press
`Shift+Ctrl+Alt+R` (Windows/Linux) / `Shift+Cmd+Alt+R` (macOS) to open the
**Run Command...** picker.

| Menu Item | Description |
|-----------|-------------|
| Sync Configs | Regenerate all AI tool configs from spec |
| Run Check | Lint + typecheck + tests |
| Health Check | Full repo health check |
| Orchestrate | Master coordinator — assess, plan, delegate |
| Plan | Structured implementation planning |
| Discover | Scan repo structure and tech stacks |
| Validate | Validate spec against schema |
| Show Backlog | Show consolidated backlog |
| Handoff | Generate session handoff document |
| Preflight | Pre-ship delivery checks |
| Security Scan | Security audit |
| Project Status | Unified PM dashboard |
| **Run Command...** | Choose and run any Retort command |

## Tool Window

The **Retort** panel (right side bar) shows:

- Active orchestration phase
- In-progress tasks from `.claude/state/tasks/`
- Quick-launch buttons for common commands

## Status Bar Widget

A widget on the right of the status bar shows the active phase. Click it to
open the command picker.

## Junie Integration

> **Status:** The Junie third-party context API is not yet public. The
> integration is pre-wired and will activate automatically once JetBrains
> publishes a stable extension point.

When both the Retort plugin and [Junie](https://plugins.jetbrains.com/plugin/24367-junie)
are installed, Retort registers a workspace context provider that injects:

- The active orchestration **phase** (Discovery / Planning / Implementation / Validation / Ship)
- **In-progress task titles** from `.claude/state/tasks/`
- The path to the **teams file** (`.agentkit/spec/teams.yaml` or `AGENT_TEAMS.md`)

This context block is prepended to each Junie AI session so the assistant is
immediately aware of what the team is working on and which slash commands are
available.

### How the optional dependency works

The Junie integration is declared as an optional plugin dependency in
`META-INF/plugin.xml`:

```xml
<depends optional="true" config-file="junie.xml">com.intellij.junie</depends>
```

- If Junie is **not** installed the `junie.xml` descriptor is never loaded and
  no Junie classes are referenced — the plugin works exactly as before.
- If Junie **is** installed, `RetortWorkspaceContextService` is registered as a
  project service and wired to Junie's context provider once JetBrains publishes
  the stable API.

### Enabling context injection manually (until API is public)

Until the official `JunieContextProvider` extension point ships you can copy the
context string into a Junie session manually:

1. Open the **Retort** tool window.
2. Click **Copy Workspace Context** (shows active phase + tasks).
3. Paste into the Junie chat as the first message.

## Troubleshooting

**Plugin not activating**
: Ensure `.agentkit/spec/project.yaml` exists at the project root.
  Check **Help → Show Log in Explorer/Finder** for `RetortPlugin` log lines.

**Junie section missing in tool window**
: The Junie section only renders when Junie is installed. Install it via
  **Settings → Plugins → Marketplace → Junie**.

**`gradlew buildPlugin` fails with SDK error**
: Run `./gradlew wrapper` to refresh the Gradle wrapper, then check that a
  JDK 17+ is configured in **File → Project Structure → SDKs**.

**Build fails: `until-build` compatibility**
: The plugin targets builds up to `251.*`. If your IDE build is newer, update
  `until-build` in `plugin.xml` and `intellijPlatform { ... }` in
  `build.gradle.kts`, then rebuild.
