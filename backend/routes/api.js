import { Router } from "express";
import * as apiController from "../controllers/apiController.js";
import { authMiddleware, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

// Organizations
router.post("/organizations", requireAuth, apiController.createOrganization);
router.get("/organizations", apiController.fetchOrganizations);
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

export default router;
