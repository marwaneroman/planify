import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchProject, fetchTasks, createTask, updateTask,
  fetchComments, addComment, logActivity, fetchOrgMembers,
} from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Calendar, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

const statusColumns = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

const ProjectDetail = () => {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newComment, setNewComment] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("backlog");
  const [creating, setCreating] = useState(false);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !!projectId,
  });

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId!),
    enabled: !!projectId,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["comments", selectedTask?.id],
    queryFn: () => fetchComments(selectedTask!.id),
    enabled: !!selectedTask,
  });

  const { data: members } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => fetchOrgMembers(orgId!),
    enabled: !!orgId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      updateTask(id, updates),
    onSuccess: () => {
      refetchTasks();
    },
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createTask(projectId!, title, desc, priority, status);
      await logActivity(orgId!, `created task "${title}"`, "task");
      toast({ title: "Task created" });
      setCreateOpen(false);
      setTitle("");
      setDesc("");
      setPriority("medium");
      setStatus("backlog");
      refetchTasks();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    try {
      await addComment(selectedTask.id, newComment.trim());
      setNewComment("");
      refetchComments();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const orgName = (project as any)?.organizations?.name;

  return (
    <AppLayout
      orgId={orgId}
      orgName={orgName}
      breadcrumbs={[
        { label: "Organizations", href: "/" },
        { label: orgName || "...", href: `/org/${orgId}` },
        { label: "Projects", href: `/org/${orgId}/projects` },
        { label: project?.name || "..." },
      ]}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project?.name}</h1>
          <p className="text-sm text-muted-foreground">{project?.description || "No description"}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Fix login bug" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusColumns.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((col) => {
          const colTasks = tasks?.filter((t) => t.status === col.key) || [];
          return (
            <div key={col.key} className="w-64 flex-shrink-0">
              <div className="mb-3 flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer border-border transition-all hover:border-primary/20 hover:shadow-sm"
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardContent className="p-3">
                      <p className="mb-2 text-sm font-medium text-foreground">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn("text-xs", priorityColors[task.priority])}>
                          {task.priority}
                        </Badge>
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), "MMM d")}
                          </span>
                        )}
                      </div>
                      {(task as any).profiles?.full_name && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          → {(task as any).profiles.full_name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">{selectedTask.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">{selectedTask.description || "No description"}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={selectedTask.status}
                      onValueChange={(val) => {
                        updateTaskMutation.mutate({ id: selectedTask.id, updates: { status: val } });
                        setSelectedTask({ ...selectedTask, status: val });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusColumns.map((s) => (
                          <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <Select
                      value={selectedTask.priority}
                      onValueChange={(val) => {
                        updateTaskMutation.mutate({ id: selectedTask.id, updates: { priority: val } });
                        setSelectedTask({ ...selectedTask, priority: val });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Comments */}
                <div className="border-t border-border pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">Comments</h4>
                  </div>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {comments?.map((comment) => (
                      <div key={comment.id} className="rounded-md bg-muted p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            {(comment as any).profiles?.full_name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                    ))}
                    {(!comments || comments.length === 0) && (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default ProjectDetail;
