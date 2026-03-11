import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { fetchOrganizations, createOrganization } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: orgs, isLoading, refetch } = useQuery({
    queryKey: ["organizations"],
    queryFn: fetchOrganizations,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const org = await createOrganization(name, description);
      toast({ title: "Organization created" });
      setOpen(false);
      setName("");
      setDescription("");
      refetch();
      navigate(`/org/${org.id}`);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    }
    setCreating(false);
  };

  return (
    <AppLayout
      breadcrumbs={[{ label: "Organizations" }]}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground">Select or create a workspace</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Acme Inc." />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your org do?" />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : orgs && orgs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer border-border transition-all hover:border-primary/30 hover:shadow-md"
              onClick={() => navigate(`/org/${org.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{org.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {org.description || "No description"}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {(org as { organization_members?: { count?: number }[] }).organization_members?.[0]?.count ?? 0} members
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">No organizations yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first organization to get started.</p>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Organization
          </Button>
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
