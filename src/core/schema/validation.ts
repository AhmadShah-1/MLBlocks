import type { Project, ProjectValidationResult } from "./project";

export function validateProjectBasic(project: Project): ProjectValidationResult {
  const errors: string[] = [];
  if (!project.projectId) {
    errors.push("Project id missing.");
  }
  if (!project.name) {
    errors.push("Project name missing.");
  }
  if (!Array.isArray(project.nodes)) {
    errors.push("Project nodes missing.");
  }
  if (!Array.isArray(project.edges)) {
    errors.push("Project edges missing.");
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

