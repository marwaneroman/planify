import { Router } from "express";
import * as apiController from "../controllers/apiController.js";
import { authMiddleware, requireAuth } from "../middleware/auth.js";

const router = Router();

/** Public health for ALB/CD smoke checks (no auth). */
router.get("/v1/status", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use(authMiddleware);

// Organizations
router.post("/organizations", requireAuth, apiController.createOrganization);
router.get("/organizations", requireAuth, apiController.fetchOrganizations);
router.get("/organizations/:orgId", apiController.fetchOrganization);
router.get("/organizations/:orgId/members", apiController.fetchOrgMembers);

// Projects
router.get("/organizations/:orgId/projects", apiController.fetchProjects);
router.post("/organizations/:orgId/projects", requireAuth, apiController.createProject);
router.get("/projects/:projectId", apiController.fetchProject);

// Tasks
router.get("/projects/:projectId/tasks", apiController.fetchTasks);
router.post("/projects/:projectId/tasks", requireAuth, apiController.createTask);
router.patch("/tasks/:taskId", apiController.updateTask);

// Comments
router.get("/tasks/:taskId/comments", apiController.fetchComments);
router.post("/tasks/:taskId/comments", requireAuth, apiController.addComment);

// Activity
router.post("/organizations/:orgId/activity", requireAuth, apiController.logActivity);
router.get("/organizations/:orgId/activity", apiController.fetchActivityLog);

// Analytics
router.get("/organizations/:orgId/analytics", apiController.fetchAnalytics);

// Invitations — ajoute ces lignes dans backend/routes/api.js
router.post("/organizations/:orgId/invite", requireAuth, apiController.inviteMember);
router.get("/organizations/:orgId/invitations", requireAuth, apiController.fetchInvitations);
router.post("/invitations/:token/accept", requireAuth, apiController.acceptInvitation);
router.delete("/invitations/:invitationId", requireAuth, apiController.cancelInvitation);

// ─── AJOUTE CES LIGNES DANS backend/routes/api.js avant export default router ───

router.delete("/projects/:projectId", requireAuth, apiController.deleteProject);
router.delete("/tasks/:taskId", requireAuth, apiController.deleteTask);
router.patch("/organizations/:orgId/members/:memberId/role", requireAuth, apiController.updateMemberRole);
router.delete("/organizations/:orgId/members/:memberId", requireAuth, apiController.removeMember);

export default router;
