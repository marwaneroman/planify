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

// ─── 1. Ajoute ces fonctions dans src/services/api.ts ────────────────────────

export const inviteMember = async (orgId: string, email: string, role = "member") => {
  return apiFetch<{ id: string; email: string; token: string; message: string }>(
    `/api/organizations/${orgId}/invite`,
    { method: "POST", body: JSON.stringify({ email, role }) }
  );
};

export const fetchInvitations = async (orgId: string) => {
  return apiFetch<Array<Record<string, unknown>>>(`/api/organizations/${orgId}/invitations`);
};

export const acceptInvitation = async (token: string) => {
  return apiFetch<{ message: string; organization_id: string }>(
    `/api/invitations/${token}/accept`,
    { method: "POST" }
  );
};

export const cancelInvitation = async (invitationId: string) => {
  return apiFetch(`/api/invitations/${invitationId}`, { method: "DELETE" });
};

// ─── AJOUTE CES FONCTIONS À LA FIN DE src/services/api.ts ───

export const deleteProject = async (projectId: string) => {
  return apiFetch(`/api/projects/${projectId}`, { method: "DELETE" });
};

export const deleteTask = async (taskId: string) => {
  return apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
};

export const updateMemberRole = async (orgId: string, memberId: string, role: string) => {
  return apiFetch(`/api/organizations/${orgId}/members/${memberId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
};

export const removeMember = async (orgId: string, memberId: string) => {
  return apiFetch(`/api/organizations/${orgId}/members/${memberId}`, { method: "DELETE" });
};