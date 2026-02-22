import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Layers, LayoutDashboard, Building2, FolderKanban,
  BarChart3, LogOut, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  orgId?: string;
  orgName?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const navItems = (orgId?: string) => [
  { label: "Dashboard", href: orgId ? `/org/${orgId}` : "/", icon: LayoutDashboard },
  ...(orgId
    ? [
        { label: "Projects", href: `/org/${orgId}/projects`, icon: FolderKanban },
        { label: "Analytics", href: `/org/${orgId}/analytics`, icon: BarChart3 },
      ]
    : []),
];

export const AppLayout = ({ children, orgId, orgName, breadcrumbs }: AppLayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <Link to="/" className="text-lg font-bold text-foreground">Planify</Link>
        </div>

        {orgName && (
          <div className="border-b border-border px-4 py-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="truncate text-sm font-medium text-foreground">{orgName}</span>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 p-3">
          {navItems(orgId).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 truncate px-3 text-xs text-muted-foreground">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => { signOut(); navigate("/auth"); }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 border-b border-border px-6 py-3 text-sm">
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                {bc.href ? (
                  <Link to={bc.href} className="text-muted-foreground hover:text-foreground">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{bc.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
