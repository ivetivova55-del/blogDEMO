export function Table({ className = "", ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full border-collapse ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({ className = "", ...props }) {
  return <thead className={className} {...props} />;
}

export function TableBody({ className = "", ...props }) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = "", ...props }) {
  return <tr className={className} {...props} />;
}

export function TableHead({ className = "", ...props }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-ink/60 ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = "", ...props }) {
  return (
    <td className={`px-4 py-4 text-sm text-ink ${className}`} {...props} />
  );
}
