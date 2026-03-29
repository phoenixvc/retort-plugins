import * as vscode from 'vscode';
import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';

export class StateWatcherProcess implements vscode.Disposable {
  private process: ChildProcess | null = null;
  private _port: number | null = null;
  private _onPortReady = new vscode.EventEmitter<number>();
  readonly onPortReady = this._onPortReady.event;

  private _onCommand = new vscode.EventEmitter<{ command: string; args?: string[] }>();
  readonly onCommand = this._onCommand.event;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly workspaceRoot: string,
  ) {}

  start(): void {
    // Resolve state-watcher entry point relative to extension.
    // In dev: ../../packages/state-watcher/dist/index.js
    // In packaged: bundled alongside extension
    const watcherPath = path.join(
      this.context.extensionPath,
      '..', '..', 'packages', 'state-watcher', 'dist', 'index.js',
    );

    this.process = spawn('node', [watcherPath, this.workspaceRoot], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('PORT:')) {
          this._port = parseInt(line.slice(5).trim(), 10);
          this._onPortReady.fire(this._port);
        }
        if (line.startsWith('CMD:')) {
          // Command proxied from WebSocket client — forward to terminal via onCommand
          try {
            const msg = JSON.parse(line.slice(4)) as { command: string; args?: string[] };
            this._onCommand.fire(msg);
          } catch {
            // ignore parse errors
          }
        }
      }
    });
  }

  get port(): number | null {
    return this._port;
  }

  dispose(): void {
    this.process?.kill();
    this._onPortReady.dispose();
    this._onCommand.dispose();
  }
}
