
-- Fix SELECT policy to also allow the creator to see their org
DROP POLICY "Org members can view their org" ON public.organizations;

CREATE POLICY "Org members can view their org"
ON public.organizations
FOR SELECT
TO authenticated
USING (is_org_member(auth.uid(), id) OR auth.uid() = created_by);
