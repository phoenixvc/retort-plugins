import * as vscode from 'vscode';
import { StateWatcherProcess } from '../services/stateWatcherProcess';
import { TerminalService } from '../services/terminalService';

export class RetortWebviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly stateWatcher: StateWatcherProcess,
    private readonly terminal: TerminalService,
  ) {
    stateWatcher.onPortReady((port) => {
      if (this.view) {
        this.view.webview.html = this.getHtml(port);
      }
    });

    stateWatcher.onCommand(({ command, args }) => {
      terminal.run(command, args);
    });
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    const port = this.stateWatcher.port;
    webviewView.webview.html = port
      ? this.getHtml(port)
      : this.getLoadingHtml();
  }

  private getHtml(port: number): string {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://localhost:${port}; script-src 'unsafe-inline';">
      <style>body,html,iframe{margin:0;padding:0;width:100%;height:100%;border:none;overflow:hidden;background:transparent}</style>
    </head><body>
      <iframe src="http://localhost:${port}" style="width:100%;height:100vh;border:none"></iframe>
    </body></html>`;
  }

  private getLoadingHtml(): string {
    return `<!DOCTYPE html><html><body style="color:var(--vscode-foreground);padding:16px;font-family:var(--vscode-font-family)">
      <p>Starting Retort...</p>
    </body></html>`;
  }
}
