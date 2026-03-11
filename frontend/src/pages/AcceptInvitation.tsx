import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { acceptInvitation } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Layers, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [message, setMessage] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If not logged in, redirect to auth with return URL
    if (!user) {
      navigate(`/auth?redirect=/invite/${token}`);
      return;
    }

    // Auto-accept the invitation
    const accept = async () => {
      setStatus("loading");
      try {
        const data = await acceptInvitation(token!);
        setOrgId(data.organization_id);
        setStatus("success");
        setMessage("You have successfully joined the organization!");
      } catch (err: unknown) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "This invitation is invalid or has expired.");
      }
    };

    accept();
  }, [token, user, authLoading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Planify</span>
        </div>

        <div className="rounded-xl border border-border bg-background p-8 shadow-md">
          {/* Loading */}
          {(status === "idle" || status === "loading") && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-base font-medium text-foreground">Processing your invitation...</p>
              <p className="text-sm text-muted-foreground">Please wait a moment</p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Welcome , {user?.user_metadata?.full_name || user?.email}! 🎉</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button
                className="mt-2 w-full"
                onClick={() => navigate(orgId ? `/org/${orgId}` : "/")}
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-9 w-9 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Invitation Failed</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button variant="outline" className="mt-2 w-full" onClick={() => navigate("/")}>
                Go to Home
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;