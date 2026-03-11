import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOrgMembers } from "@/services/api";

export type OrgRole = "admin" | "manager" | "member" | null;

export const useOrgRole = (orgId?: string): OrgRole => {
  const { user } = useAuth();

  const { data: members } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => fetchOrgMembers(orgId!),
    enabled: !!orgId && !!user,
  });

  if (!members || !user) return null;
  const me = (members as { user_id: string; role: string }[]).find((m) => m.user_id === user.id);
  return (me?.role as OrgRole) || null;
};

// Permission helpers
export const canInviteMembers = (role: OrgRole) => role === "admin" || role === "manager";
export const canRemoveMembers = (role: OrgRole) => role === "admin";
export const canChangeRoles = (role: OrgRole) => role === "admin";
export const canCreateProject = (role: OrgRole) => role === "admin" || role === "manager";
export const canDeleteProject = (role: OrgRole) => role === "admin";
export const canCreateTask = (role: OrgRole) => role !== null;
export const canDeleteTask = (role: OrgRole) => role === "admin" || role === "manager";
export const canViewAnalytics = (role: OrgRole) => role === "admin" || role === "manager";