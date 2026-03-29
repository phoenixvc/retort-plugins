import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class TerminalService {
  private terminal: vscode.Terminal | undefined;

  constructor(private readonly root: string) {}

  run(command: string, args: string[] = []): void {
    const bin = this.resolveBin();
    const terminalName =
      vscode.workspace.getConfiguration('retort').get<string>('terminalName') ?? 'Retort';

    // Reuse existing terminal if still alive
    if (this.terminal && this.isTerminalAlive()) {
      this.terminal.show(true);
    } else {
      this.terminal = vscode.window.createTerminal({
        name: terminalName,
        cwd: this.root,
      });
    }

    const argStr = args.length ? ` ${args.join(' ')}` : '';
    this.terminal.sendText(`${bin} ${command}${argStr}`);
    this.terminal.show(true);
  }

  private resolveBin(): string {
    // Prefer local install over global
    const local = path.join(this.root, 'node_modules', '.bin', 'agentkit');
    const localCmd = path.join(this.root, 'node_modules', '.bin', 'agentkit.cmd');
    if (fs.existsSync(local) || fs.existsSync(localCmd)) {
      return 'npx agentkit';
    }
    return 'agentkit';
  }

  private isTerminalAlive(): boolean {
    return vscode.window.terminals.some((t) => t === this.terminal);
  }
}
