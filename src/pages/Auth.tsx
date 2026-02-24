import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Layers } from "lucide-react";

const Auth = () => {
  const { user, loading: authLoading, setSession } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (authLoading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const data = await apiFetch<{ session: { access_token: string; user: { id: string; email: string; user_metadata?: { full_name: string } } } }>(
          "/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
          }
        );
        if (data?.session) {
          setSession({
            access_token: data.session.access_token,
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
              user_metadata: data.session.user.user_metadata,
            },
          });
        }
      } else {
        const data = await apiFetch<{ session?: { access_token: string; user: { id: string; email: string; user_metadata?: { full_name: string } } } }>(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify({ email, password, full_name: fullName }),
          }
        );
        if (data?.session) {
          setSession({
            access_token: data.session.access_token,
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
              user_metadata: data.session.user.user_metadata,
            },
          });
          toast({ title: "Account created", description: "Welcome!" });
        }
      }
    } catch (err: any) {
      toast({
        title: isLogin ? "Login failed" : "Sign up failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Planify</span>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{isLogin ? "Welcome back" : "Create account"}</CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to your workspace" : "Get started with Planify"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : isLogin ? "Sign in" : "Create account"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-primary hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
