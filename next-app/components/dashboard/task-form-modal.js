"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const DEFAULT_FORM = {
  title: "",
  description: "",
  deadline: "",
  priority: "MEDIUM",
  status: "IDEAS",
  tags: [],
  checklist: [],
};

const TAG_SUGGESTIONS = ["SEO", "Social Media", "Email", "PPC", "Content"]; 

const STATUS_OPTIONS = [
  { value: "IDEAS", label: "Ideas" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "FOR_REVIEW", label: "For review" },
  { value: "DONE", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  mode = "create",
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setForm({
        title: initialTask.title || "",
        description: initialTask.description || "",
        deadline: initialTask.deadline
          ? initialTask.deadline.slice(0, 10)
          : "",
        priority: initialTask.priority || "MEDIUM",
        status: initialTask.status || "IDEAS",
        tags: Array.isArray(initialTask.tags) ? initialTask.tags : [],
        checklist: Array.isArray(initialTask.checklist)
          ? initialTask.checklist
          : [],
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setTagInput("");
    setChecklistInput("");
    setError("");
  }, [initialTask, isOpen]);

  const checklistProgress = useMemo(() => {
    const total = form.checklist.length;
    if (!total) return { done: 0, total: 0, percent: 0 };
    const done = form.checklist.filter((item) => item.completed).length;
    return { done, total, percent: Math.round((done / total) * 100) };
  }, [form.checklist]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleTagAdd = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (form.tags.includes(trimmed)) return;
    setForm((current) => ({ ...current, tags: [...current.tags, trimmed] }));
    setTagInput("");
  };

  const handleTagRemove = (tag) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.filter((item) => item !== tag),
    }));
  };

  const handleChecklistAdd = () => {
    const trimmed = checklistInput.trim();
    if (!trimmed) return;
    setForm((current) => ({
      ...current,
      checklist: [
        ...current.checklist,
        { id: `item-${Date.now()}`, text: trimmed, completed: false },
      ],
    }));
    setChecklistInput("");
  };

  const handleChecklistToggle = (id) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleChecklistRemove = (id) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.filter((item) => item.id !== id),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!form.title || !form.description || !form.deadline) {
        setError("Title, description, and deadline are required.");
        setIsSubmitting(false);
        return;
      }

      await onSubmit({
        ...form,
        deadline: form.deadline,
        tags: form.tags,
        checklist: form.checklist,
      });
      onClose();
    } catch (submitError) {
      setError(submitError.message || "Unable to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-ink/10 bg-[var(--surface)] p-6 shadow-2xl dark:border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
              Marketing Task
            </p>
            <h2 className="text-2xl font-semibold text-ink">
              {mode === "edit" ? "Edit task" : "Add a new pipeline item"}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-ink/60 transition hover:bg-ink/5"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              <Label htmlFor="title">Task title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Write SEO blog post"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-ink/10 bg-[var(--surface)] px-4 py-2 text-sm text-ink shadow-sm focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <div className="rounded-2xl border border-ink/10 bg-[var(--surface)]">
              <ReactQuill
                theme="snow"
                value={form.description}
                onChange={(value) =>
                  setForm((current) => ({ ...current, description: value }))
                }
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {TAG_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      form.tags.includes(tag)
                        ? "border-ink bg-ink text-white"
                        : "border-ink/20 text-ink"
                    }`}
                    onClick={() =>
                      form.tags.includes(tag)
                        ? handleTagRemove(tag)
                        : handleTagAdd(tag)
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleTagAdd(tagInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleTagAdd(tagInput)}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-2xl border border-ink/10 bg-[var(--surface)] px-4 py-2 text-sm text-ink shadow-sm focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-ink/60">
                  <span>Checklist</span>
                  <span>
                    {checklistProgress.done}/{checklistProgress.total} complete
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-ink/10">
                  <div
                    className="h-2 rounded-full bg-emerald-400"
                    style={{ width: `${checklistProgress.percent}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {form.checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-ink/10 bg-[var(--surface)] px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleChecklistToggle(item.id)}
                        />
                        {item.text}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-ink/50"
                        onClick={() => handleChecklistRemove(item.id)}
                      >
                        Remove
                      </button>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add checklist item"
                    value={checklistInput}
                    onChange={(event) => setChecklistInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleChecklistAdd();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={handleChecklistAdd}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
