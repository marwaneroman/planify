import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { inviteMember, fetchInvitations, cancelInvitation } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { X, UserPlus, Mail, Clock, Trash2, Copy, Check, Link } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  orgId: string;
  onClose: () => void;
}

export const InviteMemberModal = ({ orgId, onClose }: Props) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ["invitations", orgId],
    queryFn: () => fetchInvitations(orgId),
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(orgId, email, role),
    onSuccess: () => {
      toast({ title: "Invitation créée ✅", description: `Invitation envoyée pour ${email}` });
      queryClient.invalidateQueries({ queryKey: ["invitations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      setEmail("");
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Une erreur est survenue", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(invitationId),
    onSuccess: () => {
      toast({ title: "Invitation annulée" });
      queryClient.invalidateQueries({ queryKey: ["invitations", orgId] });
    },
  });

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/invite/${token}`;
  };

  const handleCopyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(getInviteLink(token));
    setCopiedId(id);
    toast({ title: "Lien copié !", description: "Partagez ce lien avec votre collègue" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    inviteMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-background shadow-xl"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Invite a Member</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="invite-email">Email address</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="pl-9"
                    required
                  />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Creating..." : "Generate Invite Link"}
            </Button>
          </form>

          {/* Pending invitations */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Pending Invitations
            </p>
            {loadingInvitations ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : invitations && invitations.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {invitations.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{inv.role}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Expires {formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelMutation.mutate(inv.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-2 shrink-0"
                        title="Cancel invitation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Invite link */}
                    <div
                      className="flex items-center gap-2 rounded-md bg-background border border-border px-2.5 py-1.5 cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => handleCopyLink(inv.token, inv.id)}
                      title="Click to copy invite link"
                    >
                      <Link className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {getInviteLink(inv.token)}
                      </p>
                      {copiedId === inv.id ? (
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending invitations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};