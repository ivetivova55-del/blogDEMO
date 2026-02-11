"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
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
import { CreateTaskModal } from "@/components/dashboard/create-task-modal";

const STATUS_LABELS = {
  OPEN: "Open",
  COMPLETED: "Completed",
};

const STATUS_BADGES = {
  OPEN: "warning",
  COMPLETED: "success",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function TaskTable() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tasks");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load tasks.");
      }

      setTasks(data.tasks || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTaskCreated = (task) => {
    setTasks((current) => [task, ...current]);
  };

  const toggleStatus = async (taskId, status) => {
    const nextStatus = status === "OPEN" ? "COMPLETED" : "OPEN";

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (response.ok) {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status: nextStatus } : task
        )
      );
    }
  };

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
          <CreateTaskModal onTaskCreated={handleTaskCreated} />
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="rounded-3xl border border-ink/10 bg-white/90 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.35)]">
        <Table>
          <TableHeader className="border-b border-ink/10">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  Loading your tasks...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  No tasks yet. Add your first marketing task above.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task, index) => {
                const deadlineDate = new Date(task.deadline);
                const deadlineDay = new Date(
                  deadlineDate.getFullYear(),
                  deadlineDate.getMonth(),
                  deadlineDate.getDate()
                );
                const isOverdue =
                  task.status === "OPEN" && deadlineDay < today;
                const description =
                  task.description && task.description.length > 80
                    ? `${task.description.slice(0, 80)}...`
                    : task.description;

                return (
                  <TableRow
                    key={task.id}
                    className={`border-b border-ink/5 ${
                      index % 2 === 0 ? "bg-transparent" : "bg-ink/5"
                    }`}
                  >
                    <TableCell className="font-semibold">
                      {task.title}
                    </TableCell>
                    <TableCell title={task.description}>
                      {description}
                    </TableCell>
                    <TableCell
                      className={isOverdue ? "text-red-600" : "text-ink"}
                    >
                      {formatDate(task.deadline)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGES[task.status]}>
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(task.id, task.status)}
                      >
                        <Check className="h-4 w-4" />
                        Toggle
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
