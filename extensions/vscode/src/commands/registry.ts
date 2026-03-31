import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { TerminalService } from '../services/terminalService';

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

const PHASE_NAMES: Record<number, string> = {
  1: 'Discovery',
  2: 'Planning',
  3: 'Implementation',
  4: 'Validation',
  5: 'Ship',
};

function buildWorkspaceContext(root: string): string {
  const sections: string[] = [];

  // Phase
  try {
    const statePath = path.join(root, '.claude', 'state', 'orchestrator.json');
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as { phase?: number };
      if (state.phase !== undefined) {
        sections.push(`**Active phase:** ${PHASE_NAMES[state.phase] ?? `Phase ${state.phase}`}`);
      }
    }
  } catch { /* ignore */ }

  // In-progress tasks
  try {
    const tasksDir = path.join(root, '.claude', 'state', 'tasks');
    if (fs.existsSync(tasksDir)) {
      const inProgress = fs.readdirSync(tasksDir)
        .filter((f) => f.endsWith('.json'))
        .flatMap((f) => {
          try {
            const task = JSON.parse(fs.readFileSync(path.join(tasksDir, f), 'utf-8')) as {
              status?: string;
              title?: string;
            };
            return task.status === 'working' || task.status === 'accepted'
              ? [task.title ?? f]
              : [];
          } catch { return []; }
        });
      if (inProgress.length > 0) {
        sections.push(`**In-progress tasks:**\n${inProgress.map((t) => `- ${t}`).join('\n')}`);
      }
    }
  } catch { /* ignore */ }

  // Teams file
  const teamsPaths = [
    path.join(root, '.agentkit', 'spec', 'teams.yaml'),
    path.join(root, '.agentkit', 'spec', 'AGENT_TEAMS.yaml'),
    path.join(root, 'AGENT_TEAMS.md'),
  ];
  const teamsFile = teamsPaths.find((p) => fs.existsSync(p));
  if (teamsFile) {
    sections.push(
      `**Retort teams file:** \`${path.basename(teamsFile)}\` (use \`/team-<id>\` commands to delegate work)`,
    );
  }

  if (sections.length === 0) return '';
  return `<!-- Retort Workspace Context -->\n${sections.join('\n\n')}`;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  terminal: TerminalService,
): void {
  const run = (cmd: string, args?: string[]) => terminal.run(cmd, args);

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
    vscode.commands.registerCommand('retort.copyContext', async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!root) return;
      const ctx = buildWorkspaceContext(root);
      if (ctx) {
        await vscode.env.clipboard.writeText(ctx);
        vscode.window.setStatusBarMessage('$(check) Retort context copied', 2000);
      } else {
        vscode.window.showInformationMessage('Retort: no workspace state found — run Sync first.');
      }
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
    }),
  );
}
