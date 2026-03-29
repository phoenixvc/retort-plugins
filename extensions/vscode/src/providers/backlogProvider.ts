import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

type Priority = 'P0' | 'P1' | 'P2' | 'P3';

interface BacklogEntry {
  title: string;
  priority: Priority;
  status: string;
  team?: string;
}

export class BacklogItem extends vscode.TreeItem {
  constructor(entry: BacklogEntry) {
    super(entry.title, vscode.TreeItemCollapsibleState.None);
    this.description = entry.team ? `[${entry.team}]` : '';
    this.tooltip = `${entry.priority} · ${entry.status}`;
    this.iconPath = new vscode.ThemeIcon(iconForPriority(entry.priority));
  }
}

export class PriorityGroup extends vscode.TreeItem {
  constructor(
    public readonly priority: Priority,
    public readonly entries: BacklogEntry[]
  ) {
    super(`${priority} (${entries.length})`, vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = new vscode.ThemeIcon('list-ordered');
  }
}

type BacklogNode = PriorityGroup | BacklogItem;

export class BacklogProvider implements vscode.TreeDataProvider<BacklogNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<BacklogNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly root: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BacklogNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: BacklogNode): BacklogNode[] {
    if (!element) return this.loadGroups();
    if (element instanceof PriorityGroup) return element.entries.map((e) => new BacklogItem(e));
    return [];
  }

  private loadGroups(): PriorityGroup[] {
    const backlogPath = path.join(this.root, 'AGENT_BACKLOG.md');
    if (!fs.existsSync(backlogPath)) return [];

    const entries = this.parseBacklog(backlogPath);
    const groups: Partial<Record<Priority, BacklogEntry[]>> = {};
    for (const entry of entries) {
      if (!groups[entry.priority]) groups[entry.priority] = [];
      groups[entry.priority]!.push(entry);
    }

    return (['P0', 'P1', 'P2', 'P3'] as Priority[])
      .filter((p) => groups[p]?.length)
      .map((p) => new PriorityGroup(p, groups[p]!));
  }

  private parseBacklog(filePath: string): BacklogEntry[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entries: BacklogEntry[] = [];
    const rowRegex = /^\|\s*([^|]+?)\s*\|\s*(P[0-3])\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|/gm;
    let match: RegExpMatchArray | null;
    while ((match = rowRegex.exec(content)) !== null) {
      const [, title, priority, status, team] = match;
      if (title.trim().startsWith('-') || title.trim() === 'Title') continue;
      entries.push({
        title: title.trim(),
        priority: priority.trim() as Priority,
        status: status.trim(),
        team: team.trim() || undefined,
      });
    }
    return entries;
  }
}

function iconForPriority(p: Priority): string {
  switch (p) {
    case 'P0': return 'error';
    case 'P1': return 'warning';
    case 'P2': return 'info';
    case 'P3': return 'circle-outline';
  }
}
