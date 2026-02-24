import { prisma } from "../lib/prisma.js";
import { snakeKeys } from "../lib/serialize.js";

// Slug helper
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Ensure user has profile (for profile relations)
async function ensureProfile(userId, fullName = "") {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (profile) return profile;
  return prisma.profile.create({
    data: { userId, fullName },
  });
}

async function isOrgMember(userId, orgId) {
  const m = await prisma.organizationMember.findFirst({
    where: { organizationId: orgId, userId },
  });
  return !!m;
}

// Organizations
export async function createOrganization(req, res) {
  const { name, description } = req.body;
  const user = req.user;
  const slug = slugify(name);

  const org = await prisma.organization.create({
    data: { name, slug, description: description || "", createdBy: user.id },
  });
  await prisma.organizationMember.create({
    data: { organizationId: org.id, userId: user.id, role: "admin" },
  });
  return res.json(snakeKeys(org));
}

export async function fetchOrganizations(req, res) {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: { select: { id: true } },
    },
  });
  const result = orgs.map((o) => {
    const { members, ...rest } = o;
    return snakeKeys({
      ...rest,
      organization_members: [{ count: members.length }],
    });
  });
  return res.json(result);
}

export async function fetchOrganization(req, res) {
  const { orgId } = req.params;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });
  if (!org) return res.status(404).json({ error: "Not found" });
  return res.json(snakeKeys(org));
}

export async function fetchOrgMembers(req, res) {
  const { orgId } = req.params;
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: { include: { profile: true } },
    },
  });
  const result = members.map((m) =>
    snakeKeys({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      profiles: m.user?.profile
        ? { fullName: m.user.profile.fullName, avatarUrl: m.user.profile.avatarUrl }
        : null,
    })
  );
  return res.json(result);
}

// Projects
export async function fetchProjects(req, res) {
  const { orgId } = req.params;
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return res.json(projects.map((p) => snakeKeys(p)));
}

export async function createProject(req, res) {
  const { orgId } = req.params;
  const { name, description } = req.body;
  const user = req.user;

  const project = await prisma.project.create({
    data: {
      organizationId: orgId,
      name,
      description: description || "",
      createdBy: user.id,
    },
  });
  return res.json(snakeKeys(project));
}

export async function fetchProject(req, res) {
  const { projectId } = req.params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: { select: { name: true } } },
  });
  if (!project) return res.status(404).json({ error: "Not found" });
  const { organization, ...rest } = project;
  return res.json(
    snakeKeys({
      ...rest,
      organizations: organization ? { name: organization.name } : null,
    })
  );
}

// Tasks
export async function fetchTasks(req, res) {
  const { projectId } = req.params;
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      assignee: { select: { fullName: true, avatarUrl: true } },
    },
  });
  const result = tasks.map((t) => {
    const { assignee, ...rest } = t;
    return snakeKeys({
      ...rest,
      profiles: assignee
        ? { fullName: assignee.fullName, avatarUrl: assignee.avatarUrl }
        : null,
    });
  });
  return res.json(result);
}

export async function createTask(req, res) {
  const { projectId } = req.params;
  const { title, description, priority, status, assigneeId, dueDate } = req.body;
  const user = req.user;

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description: description || "",
      priority: priority || "medium",
      status: status || "backlog",
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      createdBy: user.id,
    },
  });
  return res.json(snakeKeys(task));
}

export async function updateTask(req, res) {
  const { taskId } = req.params;
  const updates = req.body;
  const allowed = ["title", "description", "status", "priority", "assignee_id", "assigneeId", "due_date", "dueDate"];
  const data = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.priority !== undefined) data.priority = updates.priority;
  if (updates.assignee_id !== undefined || updates.assigneeId !== undefined) {
    data.assigneeId = updates.assignee_id ?? updates.assigneeId ?? null;
  }
  if (updates.due_date !== undefined || updates.dueDate !== undefined) {
    data.dueDate = updates.due_date ?? updates.dueDate ?? null;
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
  });
  return res.json(snakeKeys(task));
}

// Comments
export async function fetchComments(req, res) {
  const { taskId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
    },
  });
  const result = comments.map((c) => ({
    ...c,
    profiles: c.user?.profile
      ? { full_name: c.user.profile.fullName, avatar_url: c.user.profile.avatarUrl }
      : null,
    user: undefined,
  }));
  return res.json(result);
}

export async function addComment(req, res) {
  const { taskId } = req.params;
  const { content } = req.body;
  const user = req.user;

  await ensureProfile(user.id, user.fullName);
  const comment = await prisma.comment.create({
    data: {
      taskId,
      userId: user.id,
      content,
    },
    include: {
      user: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
    },
  });
  const { user: commentUser, ...rest } = comment;
  return res.json(
    snakeKeys({
      ...rest,
      profiles: commentUser?.profile
        ? { fullName: commentUser.profile.fullName, avatarUrl: commentUser.profile.avatarUrl }
        : null,
    })
  );
}

// Activity
export async function logActivity(req, res) {
  const { orgId } = req.params;
  const { action, entity_type, entity_id, metadata } = req.body;
  const user = req.user;

  await ensureProfile(user.id, user.fullName);
  await prisma.activityLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action,
      entityType: entity_type || "unknown",
      entityId: entity_id || null,
      metadata: metadata || {},
    },
  });
  return res.status(201).json({ ok: true });
}

export async function fetchActivityLog(req, res) {
  const { orgId } = req.params;
  const limit = parseInt(req.query.limit || "20", 10);
  const items = await prisma.activityLog.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { fullName: true } },
    },
  });
  const result = items.map((i) => {
    const { user, ...rest } = i;
    return snakeKeys({
      ...rest,
      profiles: user ? { full_name: user.fullName } : null,
    });
  });
  return res.json(result);
}

// Analytics
export async function fetchAnalytics(req, res) {
  const { orgId } = req.params;
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });
  if (projects.length === 0) {
    return res.json({ totalTasks: 0, byStatus: [], byPriority: [], completionRate: 0 });
  }
  const projectIds = projects.map((p) => p.id);
  const tasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds } },
    select: { status: true, priority: true },
  });

  const statusCounts = {};
  const priorityCounts = {};
  let done = 0;
  tasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    if (t.status === "done") done++;
  });

  return res.json({
    totalTasks: tasks.length,
    byStatus: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    byPriority: Object.entries(priorityCounts).map(([name, value]) => ({ name, value })),
    completionRate: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
  });
}
