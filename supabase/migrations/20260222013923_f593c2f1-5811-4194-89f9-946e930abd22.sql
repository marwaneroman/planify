
-- Drop the restrictive INSERT policy and recreate as permissive
DROP POLICY "Authenticated users can create orgs" ON public.organizations;

CREATE POLICY "Authenticated users can create orgs"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also fix the SELECT policy (restrictive -> permissive)
DROP POLICY "Org members can view their org" ON public.organizations;

CREATE POLICY "Org members can view their org"
ON public.organizations
FOR SELECT
TO authenticated
USING (is_org_member(auth.uid(), id));

-- Fix UPDATE policy too
DROP POLICY "Org admins can update org" ON public.organizations;

CREATE POLICY "Org admins can update org"
ON public.organizations
FOR UPDATE
TO authenticated
USING (get_org_role(auth.uid(), id) = 'admin'::app_role);

-- Fix organization_members policies (same issue)
DROP POLICY "Org admins can add members" ON public.organization_members;

CREATE POLICY "Org admins can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  (get_org_role(auth.uid(), organization_id) = 'admin'::app_role)
  OR (NOT EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id))
);

DROP POLICY "Org members can view members" ON public.organization_members;

CREATE POLICY "Org members can view members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (is_org_member(auth.uid(), organization_id));

DROP POLICY "Org admins can remove members" ON public.organization_members;

CREATE POLICY "Org admins can remove members"
ON public.organization_members
FOR DELETE
TO authenticated
USING ((get_org_role(auth.uid(), organization_id) = 'admin'::app_role) OR (auth.uid() = user_id));

-- Fix remaining tables too
DROP POLICY "Org members can view projects" ON public.projects;
CREATE POLICY "Org members can view projects" ON public.projects FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));

DROP POLICY "Org members can create projects" ON public.projects;
CREATE POLICY "Org members can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id));

DROP POLICY "Org admins/managers can update projects" ON public.projects;
CREATE POLICY "Org admins/managers can update projects" ON public.projects FOR UPDATE TO authenticated USING (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

DROP POLICY "Org admins can delete projects" ON public.projects;
CREATE POLICY "Org admins can delete projects" ON public.projects FOR DELETE TO authenticated USING (get_org_role(auth.uid(), organization_id) = 'admin'::app_role);

DROP POLICY "Org members can view tasks" ON public.tasks;
CREATE POLICY "Org members can view tasks" ON public.tasks FOR SELECT TO authenticated USING (is_org_member(auth.uid(), get_project_org_id(project_id)));

DROP POLICY "Org members can create tasks" ON public.tasks;
CREATE POLICY "Org members can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), get_project_org_id(project_id)));

DROP POLICY "Org members can update tasks" ON public.tasks;
CREATE POLICY "Org members can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), get_project_org_id(project_id)));

DROP POLICY "Org admins can delete tasks" ON public.tasks;
CREATE POLICY "Org admins can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (get_org_role(auth.uid(), get_project_org_id(project_id)) = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

DROP POLICY "Org members can view comments" ON public.comments;
CREATE POLICY "Org members can view comments" ON public.comments FOR SELECT TO authenticated USING (is_org_member(auth.uid(), get_project_org_id(get_task_project_id(task_id))));

DROP POLICY "Org members can add comments" ON public.comments;
CREATE POLICY "Org members can add comments" ON public.comments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND is_org_member(auth.uid(), get_project_org_id(get_task_project_id(task_id))));

DROP POLICY "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY "Org members can view activity" ON public.activity_log;
CREATE POLICY "Org members can view activity" ON public.activity_log FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));

DROP POLICY "Org members can log activity" ON public.activity_log;
CREATE POLICY "Org members can log activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id));

DROP POLICY "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
