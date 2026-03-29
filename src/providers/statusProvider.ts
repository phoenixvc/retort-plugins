import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface OrchestratorState {
  phase?: number;
  activeTask?: string;
  lock?: { held: boolean; by?: string };
  lastUpdated?: string;
}

export class StatusItem extends vscode.TreeItem {
  constructor(label: string, detail: string, icon: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = detail;
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

export class StatusProvider implements vscode.TreeDataProvider<StatusItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<StatusItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly root: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: StatusItem): vscode.TreeItem {
    return element;
  }

  getChildren(): StatusItem[] {
    const state = this.loadState();
    if (!state) {
      return [new StatusItem('No orchestrator state', 'Run /orchestrate to start', 'info')];
    }
    const items: StatusItem[] = [];
    if (state.phase !== undefined) {
      items.push(new StatusItem('Phase', `${state.phase} / 5`, 'milestone'));
    }
    if (state.activeTask) {
      items.push(new StatusItem('Active task', state.activeTask, 'play'));
    }
    if (state.lock?.held) {
      items.push(new StatusItem('Lock', state.lock.by ?? 'held', 'lock'));
    }
    if (state.lastUpdated) {
      items.push(new StatusItem('Last updated', state.lastUpdated, 'clock'));
    }
    return items;
  }

  private loadState(): OrchestratorState | null {
    const statePath = path.join(this.root, '.claude', 'state', 'orchestrator.json');
    if (!fs.existsSync(statePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8')) as OrchestratorState;
    } catch {
      return null;
    }
  }
}
