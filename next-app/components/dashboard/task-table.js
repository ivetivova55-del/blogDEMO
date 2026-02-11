"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Download,
  LayoutGrid,
  Pencil,
  RefreshCw,
  Search,
  Table as TableIcon,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskFormModal } from "@/components/dashboard/task-form-modal";
import { TaskKanban } from "@/components/dashboard/task-kanban";
import { TaskCalendar } from "@/components/dashboard/task-calendar";

const STATUS_LABELS = {
  IDEAS: "Ideas",
  IN_PROGRESS: "In progress",
  FOR_REVIEW: "For review",
  DONE: "Done",
};

const STATUS_BADGES = {
  IDEAS: "warning",
  IN_PROGRESS: "default",
  FOR_REVIEW: "warning",
  DONE: "success",
};

const VIEW_OPTIONS = [
  { id: "table", label: "Table", icon: TableIcon },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

const TAG_COLORS = {
  SEO: "bg-blue-100 text-blue-700",
  "Social Media": "bg-pink-100 text-pink-700",
  Email: "bg-amber-100 text-amber-700",
  PPC: "bg-purple-100 text-purple-700",
  Content: "bg-emerald-100 text-emerald-700",
};

const FILTER_OPTIONS = [
  { id: "ALL", label: "All" },
  { id: "IDEAS", label: "Ideas" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "FOR_REVIEW", label: "For review" },
  { id: "DONE", label: "Done" },
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const stripHtml = (value) =>
  value ? value.replace(/<[^>]*>/g, "").trim() : "";

const getChecklistProgress = (checklist) => {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    return null;
  }
  const done = checklist.filter((item) => item.completed).length;
  return {
    done,
    total: checklist.length,
    percent: Math.round((done / checklist.length) * 100),
  };
};

const normalizeTask = (task) => {
  const statusMap = {
    OPEN: "IN_PROGRESS",
    COMPLETED: "DONE",
  };

  return {
    ...task,
    status: statusMap[task.status] || task.status || "IDEAS",
    tags: Array.isArray(task.tags) ? task.tags : [],
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
    priority: task.priority || "MEDIUM",
  };
};

const getTagClass = (tag) => TAG_COLORS[tag] || "bg-ink/10 text-ink";

export function TaskTable() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("table");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadTasks = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tasks");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load tasks.");
      }

      setTasks((data.tasks || []).map(normalizeTask));
    } catch (loadError) {
      setError(loadError.message || "Unable to load tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set();
    tasks.forEach((task) => {
      task.tags?.forEach((tag) => tags.add(tag));
    });
    return ["ALL", ...Array.from(tags)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks
      .filter((task) =>
        filter === "ALL" ? true : task.status === filter
      )
      .filter((task) =>
        tagFilter === "ALL" ? true : task.tags?.includes(tagFilter)
      )
      .filter((task) => {
        if (!query) return true;
        const description = stripHtml(task.description).toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          description.includes(query)
        );
      })
      .sort((a, b) => {
        const aDate = new Date(a.deadline);
        const bDate = new Date(b.deadline);
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      });
  }, [tasks, filter, tagFilter, search, sortDirection]);

  const handleCreate = async (payload) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to create task.");
    }

    setTasks((current) => [normalizeTask(data.task), ...current]);
    toast.success("Task created.");
  };

  const handleUpdate = async (taskId, payload, successMessage) => {
    const previousTasks = [...tasks];
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? normalizeTask({ ...task, ...payload }) : task
      )
    );

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setTasks(previousTasks);
      toast.error("Unable to update task.");
      return;
    }

    toast.success(successMessage || "Task updated.");
  };

  const handleDelete = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmed) return;

    const previousTasks = [...tasks];
    setTasks((current) => current.filter((task) => task.id !== taskId));

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setTasks(previousTasks);
      toast.error("Unable to delete task.");
      return;
    }

    toast.success("Task deleted.");
  };

  const handleStatusChange = async (taskId, status) => {
    const message = status === "DONE"
      ? "Task marked as completed."
      : "Task reopened.";
    await handleUpdate(taskId, { status }, message);
  };

  const exportCsv = () => {
    const headers = [
      "Title",
      "Description",
      "Deadline",
      "Status",
      "Priority",
      "Tags",
    ];
    const rows = filteredTasks.map((task) => [
      task.title,
      stripHtml(task.description),
      task.deadline,
      STATUS_LABELS[task.status],
      task.priority,
      (task.tags || []).join("|"),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value || "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "marketing_tasks.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
            Marketing pipeline
          </p>
          <h2 className="text-2xl font-semibold text-ink">
            Your content tasks at a glance
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadTasks}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            Create Task
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-ink/10 bg-[var(--panel)] p-4 shadow-[0_30px_70px_-60px_rgba(15,23,42,0.25)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((item) => (
              <Button
                key={item.id}
                variant={filter === item.id ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map((item) => (
              <Button
                key={item.id}
                variant={view === item.id ? "primary" : "secondary"}
                size="sm"
                onClick={() => setView(item.id)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full items-center gap-2 rounded-full border border-ink/10 bg-[var(--surface)] px-3 py-2 text-sm text-ink shadow-sm lg:max-w-sm">
            <Search className="h-4 w-4 text-ink/40" />
            <input
              className="w-full bg-transparent focus:outline-none"
              placeholder="Search tasks"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="rounded-full border border-ink/10 bg-[var(--surface)] px-4 py-2 text-sm text-ink"
            >
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag === "ALL" ? "All tags" : tag}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setSortDirection((current) =>
                  current === "asc" ? "desc" : "asc"
                )
              }
            >
              Deadline {sortDirection === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {view === "kanban" ? (
        <TaskKanban
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onEdit={(task) => setEditingTask(task)}
        />
      ) : null}

      {view === "calendar" ? (
        <TaskCalendar
          tasks={filteredTasks}
          onEdit={(task) => setEditingTask(task)}
        />
      ) : null}

      {view === "table" ? (
        <div className="rounded-3xl border border-ink/10 bg-[var(--panel)] shadow-[0_30px_70px_-50px_rgba(15,23,42,0.35)]">
          <div className="hidden md:block">
            <Table>
              <TableHeader className="border-b border-ink/10">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      Loading your tasks...
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-ink/60">
                        <LayoutGrid className="h-8 w-8" />
                        <span>
                          No tasks yet. Add your first marketing task above.
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task, index) => {
                    const deadlineDate = new Date(task.deadline);
                    const diffHours =
                      (deadlineDate.getTime() - now.getTime()) / 36e5;
                    const isOverdue = task.status !== "DONE" && diffHours < 0;
                    const isDueSoon =
                      task.status !== "DONE" && diffHours >= 0 && diffHours <= 24;
                    const description = stripHtml(task.description);
                    const checklist = getChecklistProgress(task.checklist);

                    return (
                      <TableRow
                        key={task.id}
                        className={`border-b border-ink/5 ${
                          index % 2 === 0 ? "bg-transparent" : "bg-ink/5"
                        } ${isOverdue ? "bg-red-50" : ""}`}
                      >
                        <TableCell
                          className={`font-semibold ${
                            task.status === "DONE" ? "line-through text-ink/50" : ""
                          }`}
                        >
                          {task.title}
                        </TableCell>
                        <TableCell title={description} className="text-ink/70">
                          <div className="[display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
                            {description}
                          </div>
                          {checklist ? (
                            <div className="mt-2 text-xs text-ink/50">
                              <div className="flex items-center justify-between">
                                <span>Checklist</span>
                                <span>
                                  {checklist.done}/{checklist.total}
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 w-full rounded-full bg-ink/10">
                                <div
                                  className="h-1.5 rounded-full bg-emerald-400"
                                  style={{ width: `${checklist.percent}%` }}
                                />
                              </div>
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell
                          className={`flex items-center gap-2 ${
                            isOverdue
                              ? "text-red-600"
                              : isDueSoon
                              ? "text-amber-600"
                              : "text-ink"
                          }`}
                        >
                          {isDueSoon ? <AlertTriangle className="h-4 w-4" /> : null}
                          {formatDate(task.deadline)}
                          {isOverdue ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                              Overdue
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGES[task.status]}>
                            {STATUS_LABELS[task.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {task.tags?.map((tag) => (
                              <Badge key={tag} variant="default" className={getTagClass(tag)}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(
                                  task.id,
                                  task.status === "DONE" ? "IN_PROGRESS" : "DONE"
                                )
                              }
                            >
                              {task.status === "DONE" ? (
                                <Undo2 className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTask(task)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink/20 p-6 text-center text-ink/60">
                No tasks yet. Add your first marketing task above.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const deadlineDate = new Date(task.deadline);
                const diffHours =
                  (deadlineDate.getTime() - now.getTime()) / 36e5;
                const isOverdue = task.status !== "DONE" && diffHours < 0;
                const isDueSoon =
                  task.status !== "DONE" && diffHours >= 0 && diffHours <= 24;
                const description = stripHtml(task.description);
                const checklist = getChecklistProgress(task.checklist);

                return (
                  <div
                    key={task.id}
                    className={`rounded-3xl border border-ink/10 bg-[var(--surface)] p-4 shadow-sm ${
                      isOverdue ? "bg-red-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            task.status === "DONE"
                              ? "line-through text-ink/50"
                              : "text-ink"
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-ink/60">
                          {description}
                        </p>
                      </div>
                      <Badge variant={STATUS_BADGES[task.status]}>
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      {isDueSoon ? <AlertTriangle className="h-4 w-4" /> : null}
                      <span
                        className={
                          isOverdue
                            ? "text-red-600"
                            : isDueSoon
                            ? "text-amber-600"
                            : "text-ink/70"
                        }
                      >
                        {formatDate(task.deadline)}
                      </span>
                      {isOverdue ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                          Overdue
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.tags?.map((tag) => (
                        <Badge key={tag} variant="default" className={getTagClass(tag)}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {checklist ? (
                      <div className="mt-3 text-xs text-ink/50">
                        <div className="flex items-center justify-between">
                          <span>Checklist</span>
                          <span>
                            {checklist.done}/{checklist.total}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-ink/10">
                          <div
                            className="h-1.5 rounded-full bg-emerald-400"
                            style={{ width: `${checklist.percent}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(
                            task.id,
                            task.status === "DONE" ? "IN_PROGRESS" : "DONE"
                          )
                        }
                      >
                        {task.status === "DONE" ? (
                          <Undo2 className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      <TaskFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <TaskFormModal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSubmit={(payload) => handleUpdate(editingTask.id, payload)}
        initialTask={editingTask}
        mode="edit"
      />
    </div>
  );
}
