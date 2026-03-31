import * as vscode from 'vscode';
import { buildWorkspaceContext } from '../commands/contextBuilder';

const PARTICIPANT_ID = 'retort';

const HELP_TEXT = `
**Retort workspace assistant**

Available commands:
- \`/status\` — active phase + in-progress tasks
- \`/teams\` — agent team roster
- \`/backlog\` — open backlog items from \`AGENT_BACKLOG.md\`

Or ask anything about your Retort workspace and I'll include current context.
`.trim();

export function registerChatParticipant(context: vscode.ExtensionContext): void {
  const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, handler);
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'retort.svg');
  context.subscriptions.push(participant);
}

async function handler(
  request: vscode.ChatRequest,
  _context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  _token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) {
    stream.markdown('No workspace folder open.');
    return {};
  }

  const cmd = request.command;

  if (cmd === 'status') {
    stream.markdown(buildWorkspaceContext(root) || '_No Retort state found — run Sync first._');
    return {};
  }

  if (cmd === 'teams') {
    const teams = readTeams(root);
    stream.markdown(teams || '_No teams file found (`.agentkit/spec/teams.yaml` or `AGENT_TEAMS.md`)._');
    return {};
  }

  if (cmd === 'backlog') {
    const backlog = readBacklog(root);
    stream.markdown(backlog || '_No `AGENT_BACKLOG.md` found — run `/backlog` in the terminal to generate it._');
    return {};
  }

  // Default: inject full context as a system block, then let Copilot answer
  const ctx = buildWorkspaceContext(root);
  if (ctx) {
    stream.markdown(`${ctx}\n\n---\n`);
  }
  if (!request.prompt.trim()) {
    stream.markdown(HELP_TEXT);
    return {};
  }

  // Pass through to Copilot with context prepended via references
  stream.markdown(
    '_Retort context injected above. Ask Copilot your question or use `/status`, `/teams`, `/backlog`._',
  );
  return {};
}

function readTeams(root: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const candidates = [
    path.join(root, '.agentkit', 'spec', 'teams.yaml'),
    path.join(root, '.agentkit', 'spec', 'AGENT_TEAMS.yaml'),
    path.join(root, 'AGENT_TEAMS.md'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) return '';
  try {
    const content = fs.readFileSync(found, 'utf-8');
    const ext = path.extname(found);
    return ext === '.md' ? content : `\`\`\`yaml\n${content}\n\`\`\``;
  } catch { return ''; }
}

function readBacklog(root: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const backlogPath = path.join(root, 'AGENT_BACKLOG.md');
  if (!fs.existsSync(backlogPath)) return '';
  try { return fs.readFileSync(backlogPath, 'utf-8'); } catch { return ''; }
}
