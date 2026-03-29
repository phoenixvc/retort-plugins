import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class TeamItem extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly focus: string,
    public readonly agentCount: number
  ) {
    super(id, vscode.TreeItemCollapsibleState.None);
    this.description = focus;
    this.tooltip = `${id} — ${focus} (${agentCount} agents)`;
    this.iconPath = new vscode.ThemeIcon('organization');
    this.command = {
      command: 'retort.runCommand',
      title: `Run /team-${id}`,
      arguments: [`team-${id}`],
    };
  }
}

export class TeamsProvider implements vscode.TreeDataProvider<TeamItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<TeamItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly root: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TeamItem): vscode.TreeItem {
    return element;
  }

  getChildren(): TeamItem[] {
    return this.loadTeams();
  }

  private loadTeams(): TeamItem[] {
    const agentTeamsPath = path.join(this.root, 'AGENT_TEAMS.md');
    if (fs.existsSync(agentTeamsPath)) {
      return this.parseAgentTeamsMd(agentTeamsPath);
    }
    return DEFAULT_TEAMS.map((t) => new TeamItem(t.id, t.focus, 0));
  }

  private parseAgentTeamsMd(filePath: string): TeamItem[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const items: TeamItem[] = [];
    const headingRegex = /^#{1,3}\s+([A-Z0-9_-]+)\s*(?:\(T\d+\))?/gm;
    let match: RegExpMatchArray | null;
    while ((match = headingRegex.exec(content)) !== null) {
      const id = match[1].toLowerCase();
      items.push(new TeamItem(id, '', 0));
    }
    return items.length ? items : DEFAULT_TEAMS.map((t) => new TeamItem(t.id, t.focus, 0));
  }
}

const DEFAULT_TEAMS = [
  { id: 'backend', focus: 'API, services, core logic' },
  { id: 'frontend', focus: 'UI, components, PWA' },
  { id: 'data', focus: 'DB, models, migrations' },
  { id: 'infra', focus: 'IaC, cloud resources' },
  { id: 'devops', focus: 'CI/CD, containers' },
  { id: 'testing', focus: 'Quality, coverage' },
  { id: 'security', focus: 'Auth, compliance' },
  { id: 'docs', focus: 'Docs, guides' },
  { id: 'product', focus: 'Features, PRDs' },
  { id: 'quality', focus: 'Review, refactor' },
];
