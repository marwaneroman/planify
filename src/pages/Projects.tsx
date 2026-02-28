import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchOrganization, fetchProjects, createProject, deleteProject, logActivity } from "@/services/api";
import { useOrgRole, canCreateProject, canDeleteProject } from "@/hooks/useOrgRole";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderKanban, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Projects = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const role = useOrgRole(orgId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => fetchOrganization(orgId!),
    enabled: !!orgId,
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => fetchProjects(orgId!),
    enabled: !!orgId,
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      toast({ title: "Project deleted" });
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const project = await createProject(orgId!, name, description);
      await logActivity(orgId!, `created project "${name}"`, "project", project.id);
      toast({ title: "Project created" });
      setOpen(false);
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  return (
    <AppLayout
      orgId={orgId}
      orgName={org?.name}
      breadcrumbs={[
        { label: "Organizations", href: "/" },
        { label: org?.name || "...", href: `/org/${orgId}` },
        { label: "Projects" },
      ]}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your team's projects</p>
        </div>

        {/* Only admin & manager can create projects */}
        {canCreateProject(role) && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Website Redesign" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" />
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Confirm delete dialog */}
      {canDeleteProject(role) && (
        <Dialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Project</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure? This will permanently delete the project and all its tasks.
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button
                variant="destructive" className="flex-1"
                disabled={deleteMutation.isPending}
                onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Card
              key={project.id}
              className="cursor-pointer border-border transition-all hover:border-primary/30 hover:shadow-md group relative"
              onClick={() => navigate(`/org/${orgId}/projects/${project.id}`)}
            >
              {/* Delete button — only admin */}
              {canDeleteProject(role) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(project.id); }}
                  className="absolute right-3 top-3 hidden group-hover:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <FolderKanban className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                  {project.description || "No description"}
                </p>
                <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                  {project.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {canCreateProject(role) ? "Create your first project to start tracking tasks." : "No projects have been created yet."}
          </p>
          {canCreateProject(role) && (
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Projects;