import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import type { Project } from "../../core/schema/project";
import { getMlblocksDir, getWorkspaceRoot } from "../fs/workspacePaths";

const DEFAULT_PROJECT: Project = {
  schemaVersion: 1,
  projectId: "project_" + Date.now(),
  name: "My MLBlocks Project",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  language: "python",
  settings: {
    previewLines: 50
  },
  nodes: [],
  edges: [],
  ui: {
    viewport: { x: 0, y: 0, zoom: 1 }
  }
};

export class ProjectStore {
  private cachedProject: Project | null = null;

  async loadProject(): Promise<Project> {
    if (this.cachedProject) {
      return this.cachedProject;
    }
    const root = getWorkspaceRoot();
    const filePath = path.join(getMlblocksDir(root), "project.graph.json");
    try {
      const raw = await fs.readFile(filePath, "utf8");
      this.cachedProject = JSON.parse(raw) as Project;
      return this.cachedProject;
    } catch {
      this.cachedProject = { ...DEFAULT_PROJECT };
      return this.cachedProject;
    }
  }

  async saveProject(project: Project): Promise<void> {
    const root = getWorkspaceRoot();
    const mlblocksDir = getMlblocksDir(root);
    const filePath = path.join(mlblocksDir, "project.graph.json");
    const updated = { ...project, updatedAt: new Date().toISOString() };
    await fs.mkdir(mlblocksDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), "utf8");
    this.cachedProject = updated;
  }

  async openBlockFile(nodeId: string, content: string): Promise<vscode.Uri> {
    const root = getWorkspaceRoot();
    const blocksDir = path.join(getMlblocksDir(root), "blocks");
    await fs.mkdir(blocksDir, { recursive: true });
    const filePath = path.join(blocksDir, `${nodeId}.py`);
    await fs.writeFile(filePath, content, "utf8");
    return vscode.Uri.file(filePath);
  }
}

