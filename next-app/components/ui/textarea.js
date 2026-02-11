export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`min-h-[120px] w-full rounded-2xl border border-ink/10 bg-[var(--surface)] px-4 py-2 text-sm text-ink shadow-sm focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/20 ${className}`}
      {...props}
    />
  );
}
