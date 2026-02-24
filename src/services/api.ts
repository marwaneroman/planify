import { apiFetch } from "@/lib/apiClient";

export const createOrganization = async (name: string, description: string) => {
  const data = await apiFetch<{ id: string }>("/api/organizations", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
  return data;
};

export const fetchOrganizations = async () => {
  return apiFetch<Array<Record<string, unknown>>>("/api/organizations");
};

export const fetchOrganization = async (orgId: string) => {
  return apiFetch<Record<string, unknown>>(`/api/organizations/${orgId}`);
};

export const fetchOrgMembers = async (orgId: string) => {
  return apiFetch<Array<Record<string, unknown>>>(`/api/organizations/${orgId}/members`);
};

export const fetchProjects = async (orgId: string) => {
  return apiFetch<Array<Record<string, unknown>>>(`/api/organizations/${orgId}/projects`);
};

export const createProject = async (orgId: string, name: string, description: string) => {
  return apiFetch<Record<string, unknown>>(`/api/organizations/${orgId}/projects`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
};

export const fetchProject = async (projectId: string) => {
  return apiFetch<Record<string, unknown>>(`/api/projects/${projectId}`);
};

export const fetchTasks = async (projectId: string) => {
  return apiFetch<Array<Record<string, unknown>>>(`/api/projects/${projectId}/tasks`);
};

export const createTask = async (
  projectId: string,
  title: string,
  description: string,
  priority: string,
  status: string,
  assigneeId?: string,
  dueDate?: string
) => {
  return apiFetch<Record<string, unknown>>(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify({
      title,
      description,
      priority,
      status,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
    }),
  });
};

export const updateTask = async (taskId: string, updates: Record<string, unknown>) => {
  return apiFetch<Record<string, unknown>>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
};

export const fetchComments = async (taskId: string) => {
  return apiFetch<Array<Record<string, unknown>>>(`/api/tasks/${taskId}/comments`);
};

export const addComment = async (taskId: string, content: string) => {
  return apiFetch<Record<string, unknown>>(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
};

export const logActivity = async (
  orgId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) => {
  await apiFetch(`/api/organizations/${orgId}/activity`, {
    method: "POST",
    body: JSON.stringify({
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      metadata: metadata || {},
    }),
  });
};

export const fetchActivityLog = async (orgId: string, limit = 20) => {
  return apiFetch<Array<Record<string, unknown>>>(
    `/api/organizations/${orgId}/activity?limit=${limit}`
  );
};

export const fetchAnalytics = async (orgId: string) => {
  return apiFetch<{
    totalTasks: number;
    byStatus: Array<{ name: string; value: number }>;
    byPriority: Array<{ name: string; value: number }>;
    completionRate: number;
  }>(`/api/organizations/${orgId}/analytics`);
};
