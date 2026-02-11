export function Badge({ variant = "default", className = "", ...props }) {
  const variants = {
    default: "bg-ink/10 text-ink",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        variants[variant]
      } ${className}`}
      {...props}
    />
  );
}
