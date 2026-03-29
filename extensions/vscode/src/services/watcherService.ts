import * as vscode from 'vscode';

export class WatcherService implements vscode.Disposable {
  private readonly watchers: vscode.FileSystemWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly root: string,
    private readonly onChanged: () => void
  ) {
    const autoRefresh = vscode.workspace
      .getConfiguration('retort')
      .get<boolean>('autoRefresh', true);
    if (!autoRefresh) return;

    const patterns = [
      '.agentkit/spec/**',
      '.claude/state/**',
      'AGENT_BACKLOG.md',
      'AGENT_TEAMS.md',
      '.retortconfig',
    ];

    for (const pattern of patterns) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(root, pattern)
      );
      watcher.onDidChange(() => this.scheduleRefresh());
      watcher.onDidCreate(() => this.scheduleRefresh());
      watcher.onDidDelete(() => this.scheduleRefresh());
      this.watchers.push(watcher);
    }
  }

  private scheduleRefresh(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.onChanged(), 300);
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.watchers.forEach((w) => w.dispose());
  }
}
