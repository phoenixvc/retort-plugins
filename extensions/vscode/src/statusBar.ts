import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class StatusBar implements vscode.Disposable {
  private readonly syncItem: vscode.StatusBarItem;
  private readonly phaseItem: vscode.StatusBarItem;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly root: string,
  ) {
    this.syncItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.syncItem.command = 'retort.sync';
    this.syncItem.tooltip = 'Click to run Retort sync';

    this.phaseItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    this.phaseItem.command = 'retort.projectStatus';
    this.phaseItem.tooltip = 'Click to run Retort project-status';

    context.subscriptions.push(this.syncItem, this.phaseItem);

    this.refresh();
  }

  refresh(): void {
    updateSyncStatus(this.root, this.syncItem);
    updatePhase(this.root, this.phaseItem);
  }

  dispose(): void {
    // Status bar items are already pushed to context.subscriptions and will
    // be disposed by VSCode when the extension deactivates. This method
    // exists to satisfy vscode.Disposable so StatusBar can be pushed to
    // context.subscriptions directly.
  }
}

function updateSyncStatus(root: string, item: vscode.StatusBarItem): void {
  const specDir = path.join(root, '.agentkit', 'spec');
  if (!fs.existsSync(specDir)) {
    item.hide();
    return;
  }
  item.text = '$(sync) Retort';
  item.show();
}

function updatePhase(root: string, item: vscode.StatusBarItem): void {
  const statePath = path.join(root, '.claude', 'state', 'orchestrator.json');
  if (!fs.existsSync(statePath)) {
    item.hide();
    return;
  }
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as { phase?: number };
    if (state.phase !== undefined) {
      item.text = `$(milestone) Phase ${state.phase}`;
      item.show();
    } else {
      item.hide();
    }
  } catch {
    item.hide();
  }
}
