import * as vscode from 'vscode';
import { TerminalService } from '../services/terminalService';
import type { BacklogProvider } from '../providers/backlogProvider';
import type { StatusProvider } from '../providers/statusProvider';
import type { TeamsProvider } from '../providers/teamsProvider';

interface Providers {
  teamsProvider: TeamsProvider;
  backlogProvider: BacklogProvider;
  statusProvider: StatusProvider;
}

const QUICK_PICK_COMMANDS = [
  { label: '$(sync) sync', description: 'Regenerate all AI tool configs from spec' },
  { label: '$(check) check', description: 'Run lint + typecheck + tests' },
  { label: '$(pulse) healthcheck', description: 'Full repo health check' },
  { label: '$(rocket) orchestrate', description: 'Master coordinator — assess, plan, delegate' },
  { label: '$(telescope) plan', description: 'Structured implementation planning' },
  { label: '$(search) discover', description: 'Scan repo structure and tech stacks' },
  { label: '$(shield) validate', description: 'Validate spec against schema' },
  { label: '$(list-unordered) backlog', description: 'Show consolidated backlog' },
  { label: '$(book) handoff', description: 'Generate session handoff document' },
  { label: '$(checklist) preflight', description: 'Pre-ship delivery checks' },
  { label: '$(lock) security', description: 'Security audit' },
  { label: '$(dashboard) project-status', description: 'Unified PM dashboard' },
];

export function registerCommands(
  context: vscode.ExtensionContext,
  root: string,
  providers: Providers
): void {
  const terminal = new TerminalService(root);

  const run = (cmd: string) => terminal.run(cmd);

  context.subscriptions.push(
    vscode.commands.registerCommand('retort.sync', () => run('sync')),
    vscode.commands.registerCommand('retort.check', () => run('check')),
    vscode.commands.registerCommand('retort.healthcheck', () => run('healthcheck')),
    vscode.commands.registerCommand('retort.orchestrate', () => run('orchestrate')),
    vscode.commands.registerCommand('retort.plan', () => run('plan')),
    vscode.commands.registerCommand('retort.discover', () => run('discover')),
    vscode.commands.registerCommand('retort.validate', () => run('validate')),
    vscode.commands.registerCommand('retort.backlog', () => run('backlog')),
    vscode.commands.registerCommand('retort.handoff', () => run('handoff')),
    vscode.commands.registerCommand('retort.preflight', () => run('preflight')),
    vscode.commands.registerCommand('retort.security', () => run('security')),
    vscode.commands.registerCommand('retort.projectStatus', () => run('project-status')),
    vscode.commands.registerCommand('retort.refreshSidebar', () => {
      providers.teamsProvider.refresh();
      providers.backlogProvider.refresh();
      providers.statusProvider.refresh();
    }),
    vscode.commands.registerCommand('retort.runCommand', async () => {
      const picked = await vscode.window.showQuickPick(QUICK_PICK_COMMANDS, {
        placeHolder: 'Select a Retort command to run',
        matchOnDescription: true,
      });
      if (picked) {
        // Strip icon prefix (e.g. "$(sync) sync" → "sync")
        const cmd = picked.label.replace(/^\$\([^)]+\)\s*/, '');
        run(cmd);
      }
    })
  );
}
