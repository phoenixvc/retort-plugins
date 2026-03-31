import * as fs from 'fs';
import * as path from 'path';

const PHASE_NAMES: Record<number, string> = {
  1: 'Discovery',
  2: 'Planning',
  3: 'Implementation',
  4: 'Validation',
  5: 'Ship',
};

/**
 * Reads Retort workspace state and returns a markdown context block.
 * Returns an empty string if no state files exist.
 *
 * Reads:
 *   - .claude/state/orchestrator.json  → active phase
 *   - .claude/state/tasks/*.json       → in-progress tasks
 *   - .agentkit/spec/teams.yaml        → team roster hint
 */
export function buildWorkspaceContext(root: string): string {
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
            const task = JSON.parse(
              fs.readFileSync(path.join(tasksDir, f), 'utf-8'),
            ) as { status?: string; title?: string };
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
  const teamsCandidates = [
    path.join(root, '.agentkit', 'spec', 'teams.yaml'),
    path.join(root, '.agentkit', 'spec', 'AGENT_TEAMS.yaml'),
    path.join(root, 'AGENT_TEAMS.md'),
  ];
  const teamsFile = teamsCandidates.find((p) => fs.existsSync(p));
  if (teamsFile) {
    sections.push(
      `**Retort teams file:** \`${path.basename(teamsFile)}\` (use \`/team-<id>\` commands to delegate work)`,
    );
  }

  if (sections.length === 0) return '';
  return `<!-- Retort Workspace Context -->\n${sections.join('\n\n')}`;
}
