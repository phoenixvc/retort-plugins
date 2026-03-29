import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface StatusBarHandle {
  refresh(): void;
}

export function createStatusBar(
  root: string,
  context: vscode.ExtensionContext
): StatusBarHandle {
  const syncItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  syncItem.command = 'retort.sync';
  syncItem.tooltip = 'Click to run Retort sync';

  const phaseItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  phaseItem.command = 'retort.projectStatus';
  phaseItem.tooltip = 'Click to run Retort project-status';

  context.subscriptions.push(syncItem, phaseItem);

  function refresh(): void {
    updateSyncStatus(root, syncItem);
    updatePhase(root, phaseItem);
  }

  refresh();
  return { refresh };
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
