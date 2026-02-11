"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export function TaskCalendar({ tasks, onEdit }) {
  const events = tasks
    .filter((task) => task.deadline)
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: new Date(task.deadline),
      end: new Date(task.deadline),
      resource: task,
    }));

  return (
    <div className="rounded-3xl border border-ink/10 bg-[var(--panel)] p-4 shadow-[0_30px_70px_-60px_rgba(15,23,42,0.3)]">
      <Calendar
        localizer={localizer}
        events={events}
        style={{ height: 520 }}
        onSelectEvent={(event) => onEdit(event.resource)}
      />
    </div>
  );
}
