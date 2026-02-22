import { supabase } from "@/integrations/supabase/client";

export const createOrganization = async (name: string, description: string) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug, description, created_by: user.id })
    .select()
    .single();
  if (orgError) throw orgError;

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: user.id, role: "admin" });
  if (memberError) throw memberError;

  return org;
};

export const fetchOrganizations = async () => {
  const { data, error } = await supabase
    .from("organizations")
    .select("*, organization_members(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchOrganization = async (orgId: string) => {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();
  if (error) throw error;
  return data;
};

export const fetchOrgMembers = async (orgId: string) => {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*, profiles:organization_members_user_id_profiles_fkey(full_name, avatar_url)")
    .eq("organization_id", orgId);
  if (error) throw error;
  return data;
};

export const fetchProjects = async (orgId: string) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const createProject = async (orgId: string, name: string, description: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .insert({ organization_id: orgId, name, description, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*, organizations(name)")
    .eq("id", projectId)
    .single();
  if (error) throw error;
  return data;
};

export const fetchTasks = async (projectId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, profiles:tasks_assignee_id_profiles_fkey(full_name, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title,
      description,
      priority: priority as any,
      status: status as any,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateTask = async (taskId: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchComments = async (taskId: string) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles:comments_user_id_profiles_fkey(full_name, avatar_url)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};

export const addComment = async (taskId: string, content: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("comments")
    .insert({ task_id: taskId, user_id: user.id, content })
    .select("*, profiles:comments_user_id_profiles_fkey(full_name, avatar_url)")
    .single();
  if (error) throw error;
  return data;
};

export const logActivity = async (
  orgId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, any>
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("activity_log").insert({
    organization_id: orgId,
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || {},
  });
};

export const fetchActivityLog = async (orgId: string, limit = 20) => {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*, profiles:activity_log_user_id_profiles_fkey(full_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

export const fetchAnalytics = async (orgId: string) => {
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", orgId);

  if (!projects || projects.length === 0) {
    return { totalTasks: 0, byStatus: [], byPriority: [], completionRate: 0 };
  }

  const projectIds = projects.map((p) => p.id);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("status, priority")
    .in("project_id", projectIds);

  if (!tasks) return { totalTasks: 0, byStatus: [], byPriority: [], completionRate: 0 };

  const statusCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};
  let done = 0;

  tasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    if (t.status === "done") done++;
  });

  return {
    totalTasks: tasks.length,
    byStatus: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    byPriority: Object.entries(priorityCounts).map(([name, value]) => ({ name, value })),
    completionRate: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
  };
};
