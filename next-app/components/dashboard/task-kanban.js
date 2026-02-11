"use client";

import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABELS = {
  IDEAS: "Ideas",
  IN_PROGRESS: "In progress",
  FOR_REVIEW: "For review",
  DONE: "Done",
};

const STATUS_ORDER = ["IDEAS", "IN_PROGRESS", "FOR_REVIEW", "DONE"];

const TAG_COLORS = {
  SEO: "bg-blue-100 text-blue-700",
  "Social Media": "bg-pink-100 text-pink-700",
  Email: "bg-amber-100 text-amber-700",
  PPC: "bg-purple-100 text-purple-700",
  Content: "bg-emerald-100 text-emerald-700",
};

const getTagClass = (tag) => TAG_COLORS[tag] || "bg-ink/10 text-ink";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const checklistSummary = (checklist) => {
  if (!Array.isArray(checklist) || checklist.length === 0) return null;
  const done = checklist.filter((item) => item.completed).length;
  return `${done}/${checklist.length} complete`;
};

function DroppableColumn({ id, title, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[240px] flex-col gap-3 rounded-3xl border border-ink/10 bg-[var(--panel)] p-4 shadow-[0_30px_70px_-60px_rgba(15,23,42,0.25)] transition ${
        isOver ? "border-emerald-300/70" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/50">
          {title}
        </h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SortableTaskCard({ task, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-2xl border border-ink/10 bg-[var(--surface)] p-4 shadow-sm ${
        task.status === "DONE" ? "text-ink/50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{task.title}</p>
          <p className="mt-1 text-xs text-ink/50">
            Due {formatDate(task.deadline)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      {Array.isArray(task.tags) && task.tags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="default" className={getTagClass(tag)}>
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
      {checklistSummary(task.checklist) ? (
        <p className="mt-3 text-xs text-ink/60">
          {checklistSummary(task.checklist)}
        </p>
      ) : null}
    </div>
  );
}

export function TaskKanban({ tasks, onStatusChange, onEdit }) {
  const sensors = useSensors(useSensor(PointerSensor));

  const grouped = useMemo(() => {
    const groups = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {});
    tasks.forEach((task) => {
      groups[task.status]?.push(task);
    });
    return groups;
  }, [tasks]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const overTask = tasks.find((item) => item.id === over.id);
    const targetColumn = STATUS_ORDER.includes(over.id)
      ? over.id
      : overTask?.status;
    if (!targetColumn) return;

    const task = tasks.find((item) => item.id === active.id);
    if (!task || task.status === targetColumn) return;

    onStatusChange(task.id, targetColumn);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 lg:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <DroppableColumn key={status} id={status} title={STATUS_LABELS[status]}>
            <SortableContext
              items={grouped[status].map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {grouped[status].map((task) => (
                <SortableTaskCard key={task.id} task={task} onEdit={onEdit} />
              ))}
            </SortableContext>
          </DroppableColumn>
        ))}
      </div>
    </DndContext>
  );
}
