export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={`mb-4 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return (
    <h3 className={`text-lg font-semibold text-ink ${className}`} {...props} />
  );
}

export function CardDescription({ className = "", ...props }) {
  return (
    <p className={`text-sm text-ink/60 ${className}`} {...props} />
  );
}

export function CardContent({ className = "", ...props }) {
  return <div className={className} {...props} />;
}
