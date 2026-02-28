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

// ─── INVITATIONS ─────────────────────────────────────────────────────────────

export async function inviteMember(req, res) {
  const { orgId } = req.params;
  const { email, role = "member" } = req.body;
  const user = req.user;

  if (!email) return res.status(400).json({ error: "Email is required" });

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId: existingUser.id },
    });
    if (alreadyMember) {
      return res.status(409).json({ error: "User is already a member of this organization" });
    }
  }

  // Check if invitation already exists
  const existingInvite = await prisma.invitation.findFirst({
    where: { organizationId: orgId, email, acceptedAt: null },
  });
  if (existingInvite) {
    return res.status(409).json({ error: "An invitation has already been sent to this email" });
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: orgId,
      email,
      role,
      invitedBy: user.id,
      expiresAt,
    },
    include: {
      organization: { select: { name: true } },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      action: `invited ${email} to join`,
      entityType: "invitation",
      entityId: invitation.id,
      metadata: { email, role },
    },
  });

  return res.status(201).json(snakeKeys({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    organizationName: invitation.organization.name,
    message: `Invitation created for ${email}. Share this token to invite them: ${invitation.token}`,
  }));
}

export async function fetchInvitations(req, res) {
  const { orgId } = req.params;

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: orgId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      inviter: { select: { fullName: true, email: true } },
    },
  });

  const result = invitations.map((inv) => snakeKeys({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    token: inv.token,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    invitedBy: inv.inviter ? { fullName: inv.inviter.fullName, email: inv.inviter.email } : null,
  }));

  return res.json(result);
}

export async function acceptInvitation(req, res) {
  const { token } = req.params;
  const user = req.user;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) return res.status(404).json({ error: "Invitation not found" });
  if (invitation.acceptedAt) return res.status(409).json({ error: "Invitation already accepted" });
  if (new Date() > invitation.expiresAt) return res.status(410).json({ error: "Invitation has expired" });
  if (invitation.email !== user.email) return res.status(403).json({ error: "This invitation is for a different email address" });

  // Check if already a member
  const alreadyMember = await prisma.organizationMember.findFirst({
    where: { organizationId: invitation.organizationId, userId: user.id },
  });
  if (alreadyMember) return res.status(409).json({ error: "You are already a member of this organization" });

  // Add as member + mark accepted
  const [member] = await prisma.$transaction([
    prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    }),
  ]);

  // Log activity
  await prisma.activityLog.create({
    data: {
      organizationId: invitation.organizationId,
      userId: user.id,
      action: `accepted invitation and joined the organization`,
      entityType: "invitation",
      entityId: invitation.id,
      metadata: {},
    },
  });

  return res.json(snakeKeys({
    message: "Invitation accepted successfully",
    organizationId: invitation.organizationId,
    role: member.role,
  }));
}

export async function cancelInvitation(req, res) {
  const { invitationId } = req.params;

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) return res.status(404).json({ error: "Invitation not found" });

  await prisma.invitation.delete({ where: { id: invitationId } });
  return res.json({ message: "Invitation cancelled" });
}
// ─── AJOUTE CES FONCTIONS À LA FIN DE backend/controllers/apiController.js ───

export async function deleteProject(req, res) {
  const { projectId } = req.params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: "Project not found" });
  await prisma.project.delete({ where: { id: projectId } });
  return res.json({ message: "Project deleted" });
}

export async function deleteTask(req, res) {
  const { taskId } = req.params;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return res.status(404).json({ error: "Task not found" });
  await prisma.task.delete({ where: { id: taskId } });
  return res.json({ message: "Task deleted" });
}

export async function updateMemberRole(req, res) {
  const { orgId, memberId } = req.params;
  const { role } = req.body;
  const validRoles = ["admin", "manager", "member"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) return res.status(404).json({ error: "Member not found" });

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
    include: { user: { include: { profile: true } } },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: orgId,
      userId: req.user.id,
      action: `changed role of ${updated.user?.profile?.fullName || updated.user?.email} to ${role}`,
      entityType: "member",
      entityId: memberId,
      metadata: { role },
    },
  });

  return res.json(snakeKeys({
    id: updated.id,
    userId: updated.userId,
    role: updated.role,
    profiles: updated.user?.profile
      ? { fullName: updated.user.profile.fullName }
      : null,
  }));
}

export async function removeMember(req, res) {
  const { orgId, memberId } = req.params;
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: { user: { include: { profile: true } } },
  });
  if (!member) return res.status(404).json({ error: "Member not found" });

  // Prevent removing the last admin
  if (member.role === "admin") {
    const adminCount = await prisma.organizationMember.count({
      where: { organizationId: orgId, role: "admin" },
    });
    if (adminCount <= 1) {
      return res.status(400).json({ error: "Cannot remove the last admin" });
    }
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });

  await prisma.activityLog.create({
    data: {
      organizationId: orgId,
      userId: req.user.id,
      action: `removed ${member.user?.profile?.fullName || member.user?.email} from the organization`,
      entityType: "member",
      entityId: memberId,
      metadata: {},
    },
  });

  return res.json({ message: "Member removed" });
}