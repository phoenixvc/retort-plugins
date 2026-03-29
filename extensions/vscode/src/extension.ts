import * as vscode from 'vscode';
import { registerCommands } from './commands/registry';
import { TerminalService } from './services/terminalService';
import { StatusBar } from './statusBar';
import { RetortWebviewProvider } from './providers/webviewProvider';
import { StateWatcherProcess } from './services/stateWatcherProcess';

export function activate(context: vscode.ExtensionContext): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) return;

  const terminal = new TerminalService(workspaceRoot);
  const statusBar = new StatusBar(context, workspaceRoot);
  const stateWatcher = new StateWatcherProcess(context, workspaceRoot);
  const webviewProvider = new RetortWebviewProvider(context, stateWatcher, terminal);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('retort.dashboard', webviewProvider),
    stateWatcher,
    statusBar,
  );

  registerCommands(context, terminal);

  stateWatcher.start();
}

export function deactivate(): void {
  // nothing to clean up — subscriptions are disposed automatically
}
