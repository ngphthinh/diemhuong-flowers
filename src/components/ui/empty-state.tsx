import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center rounded-3xl border border-dashed border-rose/40 bg-white/60 px-6 py-14 text-center", className)}>
      {icon && <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-rose-soft text-rose-dark">{icon}</span>}
      <h3 className="font-serif text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
