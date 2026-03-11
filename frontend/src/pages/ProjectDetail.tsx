import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchProject, fetchTasks, createTask, updateTask, deleteTask,
  fetchComments, addComment, logActivity, fetchOrgMembers,
} from "@/services/api";
import { useOrgRole, canCreateTask, canDeleteTask } from "@/hooks/useOrgRole";
import { UserAvatar } from "@/components/UserAvatar";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Calendar, Send, Trash2 } from "lucide-react";
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
  const role = useOrgRole(orgId);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string; status?: string; priority?: string } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);
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

  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId!),
    enabled: !!projectId,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["comments", selectedTask?.id],
    queryFn: () => fetchComments(selectedTask!.id),
    enabled: !!selectedTask,
  });

  useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => fetchOrgMembers(orgId!),
    enabled: !!orgId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      toast({ title: "Task deleted" });
      setConfirmDeleteTaskId(null);
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (err: unknown) => toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" }),
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createTask(projectId!, title, desc, priority, status);
      await logActivity(orgId!, `created task "${title}"`, "task");
      toast({ title: "Task created" });
      setCreateOpen(false);
      setTitle(""); setDesc(""); setPriority("medium"); setStatus("backlog");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
    setCreating(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    try {
      await addComment(selectedTask.id, newComment.trim());
      setNewComment("");
      refetchComments();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  };

  const orgName = (project as { organizations?: { name?: string } })?.organizations?.name;

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
        {canCreateTask(role) && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
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
        )}
      </div>

      {/* Confirm delete task */}
      <Dialog open={!!confirmDeleteTaskId} onOpenChange={(o) => !o && setConfirmDeleteTaskId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Task</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? This will permanently delete the task and all its comments.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteTaskId(null)}>Cancel</Button>
            <Button
              variant="destructive" className="flex-1"
              disabled={deleteTaskMutation.isPending}
              onClick={() => confirmDeleteTaskId && deleteTaskMutation.mutate(confirmDeleteTaskId)}
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((col) => {
          const colTasks = tasks?.filter((t: { status?: string }) => t.status === col.key) || [];
          return (
            <div key={col.key} className="w-64 flex-shrink-0">
              <div className="mb-3 flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task: { id: string; title: string; status?: string; priority?: string; due_date?: string; profiles?: { full_name?: string }; description?: string }) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer border-border transition-all hover:border-primary/20 hover:shadow-sm group relative"
                    onClick={() => setSelectedTask(task)}
                  >
                    {canDeleteTask(role) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteTaskId(task.id); }}
                        className="absolute right-2 top-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <CardContent className="p-3">
                      <p className="mb-2 text-sm font-medium text-foreground pr-6">{task.title}</p>
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
                      {/* Avatar on task */}
                      {task.profiles?.full_name && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <UserAvatar name={task.profiles.full_name} size="sm" />
                          <span className="text-xs text-muted-foreground">{task.profiles.full_name}</span>
                        </div>
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
                <div className="flex items-start justify-between gap-2">
                  <SheetTitle className="text-left">{selectedTask.title}</SheetTitle>
                  {canDeleteTask(role) && (
                    <button
                      onClick={() => { setConfirmDeleteTaskId(selectedTask.id); setSelectedTask(null); }}
                      className="shrink-0 p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
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

                {/* Comments with avatars */}
                <div className="border-t border-border pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">Comments</h4>
                  </div>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {comments?.map((comment: { id: string; content: string; profiles?: { full_name?: string }; created_at?: string }) => (
                      <div key={comment.id} className="flex gap-2.5">
                        <UserAvatar
                          name={comment.profiles?.full_name}
                          size="sm"
                          className="mt-0.5 shrink-0"
                        />
                        <div className="flex-1 rounded-md bg-muted p-2.5">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">
                              {comment.profiles?.full_name || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{comment.content}</p>
                        </div>
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