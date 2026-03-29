import * as vscode from 'vscode';
import { registerCommands } from './commands/registry';
import { BacklogProvider } from './providers/backlogProvider';
import { StatusProvider } from './providers/statusProvider';
import { TeamsProvider } from './providers/teamsProvider';
import { createStatusBar } from './statusBar';
import { WatcherService } from './services/watcherService';

export function activate(context: vscode.ExtensionContext): void {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) return;

  // Tree data providers
  const teamsProvider = new TeamsProvider(root);
  const backlogProvider = new BacklogProvider(root);
  const statusProvider = new StatusProvider(root);

  vscode.window.registerTreeDataProvider('retort.teams', teamsProvider);
  vscode.window.registerTreeDataProvider('retort.backlog', backlogProvider);
  vscode.window.registerTreeDataProvider('retort.status', statusProvider);

  // Status bar
  const statusBar = createStatusBar(root, context);

  // File watchers — refresh sidebar on spec/state/backlog changes
  const watcher = new WatcherService(root, () => {
    teamsProvider.refresh();
    backlogProvider.refresh();
    statusProvider.refresh();
    statusBar.refresh();
  });
  context.subscriptions.push(watcher);

  // Commands
  registerCommands(context, root, { teamsProvider, backlogProvider, statusProvider });
}

export function deactivate(): void {
  // nothing to clean up
}
