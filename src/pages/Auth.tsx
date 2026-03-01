import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Layers, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const { user, loading: authLoading, setSession } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  if (authLoading) return null;
if (user) {
  const redirect = searchParams.get("redirect");
  return <Navigate to={redirect || "/"} replace />;
}
  const handleToggle = () => {
    setFlipped(!flipped);
    setTimeout(() => setIsLogin(!isLogin), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const data = await apiFetch<{ session: { access_token: string; user: { id: string; email: string; user_metadata?: { full_name: string } } } }>(
          "/auth/login",
          { method: "POST", body: JSON.stringify({ email, password }) }
        );
        if (data?.session) {
          setSession({
            access_token: data.session.access_token,
            user: { id: data.session.user.id, email: data.session.user.email, user_metadata: data.session.user.user_metadata },
          });
        }
      } else {
        const data = await apiFetch<{ session?: { access_token: string; user: { id: string; email: string; user_metadata?: { full_name: string } } } }>(
          "/auth/register",
          { method: "POST", body: JSON.stringify({ email, password, full_name: fullName }) }
        );
        if (data?.session) {
          setSession({
            access_token: data.session.access_token,
            user: { id: data.session.user.id, email: data.session.user.email, user_metadata: data.session.user.user_metadata },
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
    <>
      <style>{`
        .flip-scene {
          perspective: 1200px;
          width: 100%;
          height: ${flipped ? "490px" : "380px"};
          transition: height 0.6s cubic-bezier(0.45, 0, 0.55, 1);
        }

        .flip-card {
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.45, 0, 0.55, 1);
          transform-style: preserve-3d;
          position: relative;
        }

        .flip-card.flipped {
          transform: rotateY(180deg);
        }

        .flip-face {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .flip-face-back {
          transform: rotateY(180deg);
        }

        .flip-face .border-border {
          height: 100%;
        }
      `}</style>

      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-fade-in">

          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Planify</span>
          </div>

          {/* Flip scene */}
          <div className="flip-scene">
            <div className={`flip-card ${flipped ? "flipped" : ""}`}>

              {/* FRONT — Login */}
              <div className="flip-face">
                <Card className="border-border shadow-md">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to your workspace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-login">Email</Label>
                        <Input
                          id="email-login"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-login">Password</Label>
                        <div className="relative">
                          <Input
                            id="password-login"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            required
                            minLength={6}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Loading..." : "Sign in"}
                      </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <button onClick={handleToggle} className="font-medium text-primary hover:underline">
                        Sign up
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* BACK — Register */}
              <div className="flip-face flip-face-back">
                <Card className="border-border shadow-md">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Create account</CardTitle>
                    <CardDescription>Get started with Planify</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jane Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-register">Email</Label>
                        <Input
                          id="email-register"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-register">Password</Label>
                        <div className="relative">
                          <Input
                            id="password-register"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            required
                            minLength={6}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Loading..." : "Create account"}
                      </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button onClick={handleToggle} className="font-medium text-primary hover:underline">
                        Sign in
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Auth;