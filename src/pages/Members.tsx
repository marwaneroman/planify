import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchOrganization, fetchOrgMembers, updateMemberRole, removeMember } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Trash2, Shield, UserCheck, User } from "lucide-react";

const roleIcons: Record<string, any> = {
  admin: Shield,
  manager: UserCheck,
  member: User,
};

const roleColors: Record<string, string> = {
  admin: "text-destructive bg-destructive/10",
  manager: "text-warning bg-warning/10",
  member: "text-muted-foreground bg-muted",
};

const Members = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => fetchOrganization(orgId!),
    enabled: !!orgId,
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => fetchOrgMembers(orgId!),
    enabled: !!orgId,
  });

  // Find current user's role
  const currentMember = members?.find((m: any) => m.user_id === user?.id);
  const currentRole = currentMember?.role || "member";
  const isAdmin = currentRole === "admin";

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateMemberRole(orgId!, memberId, role),
    onSuccess: () => {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(orgId!, memberId),
    onSuccess: () => {
      toast({ title: "Member removed" });
      setConfirmRemoveId(null);
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setConfirmRemoveId(null);
    },
  });

  return (
    <AppLayout
      orgId={orgId}
      orgName={org?.name}
      breadcrumbs={[
        { label: "Organizations", href: "/" },
        { label: org?.name || "...", href: `/org/${orgId}` },
        { label: "Members" },
      ]}
    >
      {/* Confirm remove dialog */}
      <Dialog open={!!confirmRemoveId} onOpenChange={(o) => !o && setConfirmRemoveId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Member</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this member from the organization?
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmRemoveId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={removeMutation.isPending}
              onClick={() => confirmRemoveId && removeMutation.mutate(confirmRemoveId)}
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Members</h1>
        <p className="text-sm text-muted-foreground">
          Manage members of {org?.name} — your role: <span className="font-medium capitalize">{currentRole}</span>
        </p>
      </div>

      {/* Role permissions summary */}
      <Card className="border-border mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Permissions Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-destructive mb-2 flex items-center gap-1">
                <Shield className="h-4 w-4" /> Admin
              </p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>✅ Invite members</li>
                <li>✅ Remove members</li>
                <li>✅ Change roles</li>
                <li>✅ Create/delete projects</li>
                <li>✅ Create/delete tasks</li>
                <li>✅ View analytics</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-warning mb-2 flex items-center gap-1">
                <UserCheck className="h-4 w-4" /> Manager
              </p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>✅ Invite members</li>
                <li>❌ Remove members</li>
                <li>❌ Change roles</li>
                <li>✅ Create projects</li>
                <li>✅ Create/delete tasks</li>
                <li>✅ View analytics</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <User className="h-4 w-4" /> Member
              </p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>❌ Invite members</li>
                <li>❌ Remove members</li>
                <li>❌ Change roles</li>
                <li>❌ Create projects</li>
                <li>✅ Create tasks</li>
                <li>❌ View analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members list */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {members?.length || 0} Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : members?.map((member: any) => {
            const RoleIcon = roleIcons[member.role] || User;
            const isCurrentUser = member.user_id === user?.id;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {(member.profiles?.full_name || member.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.profiles?.full_name || "Unknown"}
                      {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </p>
                    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${roleColors[member.role]}`}>
                      <RoleIcon className="h-3 w-3" />
                      {member.role}
                    </div>
                  </div>
                </div>

                {/* Actions — only admin can change roles/remove */}
                {isAdmin && !isCurrentUser && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(role) => updateRoleMutation.mutate({ memberId: member.id, role })}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => setConfirmRemoveId(member.id)}
                      className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Members;