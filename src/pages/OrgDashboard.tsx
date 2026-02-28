import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchOrganization, fetchProjects, fetchOrgMembers, fetchActivityLog } from "@/services/api";
import { useOrgRole, canInviteMembers, canViewAnalytics } from "@/hooks/useOrgRole";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Users, Activity, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { InviteMemberModal } from "@/components/InviteMemberModal";

const OrgDashboard = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const role = useOrgRole(orgId);

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => fetchOrganization(orgId!),
    enabled: !!orgId,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => fetchProjects(orgId!),
    enabled: !!orgId,
  });

  const { data: members } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => fetchOrgMembers(orgId!),
    enabled: !!orgId,
  });

  const { data: activity } = useQuery({
    queryKey: ["activity", orgId],
    queryFn: () => fetchActivityLog(orgId!, 10),
    enabled: !!orgId,
  });

  return (
    <AppLayout
      orgId={orgId}
      orgName={org?.name}
      breadcrumbs={[
        { label: "Organizations", href: "/" },
        { label: org?.name || "..." },
      ]}
    >
      {showInviteModal && (
        <InviteMemberModal orgId={orgId!} onClose={() => setShowInviteModal(false)} />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of {org?.name}</p>
        </div>
        {/* Only admin & manager can invite */}
        {canInviteMembers(role) && (
          <Button onClick={() => setShowInviteModal(true)} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{projects?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-border ${canInviteMembers(role) ? "cursor-pointer transition-all hover:border-primary/30 hover:shadow-md" : ""}`}
          onClick={() => canInviteMembers(role) && setShowInviteModal(true)}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{members?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
            {canInviteMembers(role) && <UserPlus className="ml-auto h-4 w-4 text-muted-foreground" />}
          </CardContent>
        </Card>

        {/* Analytics — only admin & manager */}
        {canViewAnalytics(role) ? (
          <Card
            className="cursor-pointer border-border transition-all hover:border-primary/30 hover:shadow-md"
            onClick={() => navigate(`/org/${orgId}/analytics`)}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Activity className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">View Analytics</p>
                <p className="text-xs text-muted-foreground">Task completion & more</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border opacity-50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Activity className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Analytics</p>
                <p className="text-xs text-muted-foreground">Admin & Manager only</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Projects</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/org/${orgId}/projects`)}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {projects?.slice(0, 5).map((project: any) => (
              <div
                key={project.id}
                onClick={() => navigate(`/org/${orgId}/projects/${project.id}`)}
                className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{project.name}</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
                  {project.status}
                </span>
              </div>
            )) || <p className="text-sm text-muted-foreground">No projects yet</p>}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity && activity.length > 0 ? (
              activity.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{item.profiles?.full_name || "Someone"}</span>{" "}
                      {item.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default OrgDashboard;