export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-2xl border border-ink/10 bg-white px-4 py-2 text-sm text-ink shadow-sm focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/20 ${className}`}
      {...props}
    />
  );
}
