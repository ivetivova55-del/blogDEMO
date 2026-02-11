export function Label({ className = "", ...props }) {
  return (
    <label
      className={`text-xs font-semibold uppercase tracking-wide text-ink/70 ${className}`}
      {...props}
    />
  );
}
