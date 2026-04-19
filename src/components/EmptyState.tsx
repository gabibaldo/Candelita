import { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <p className="font-medium text-ink-800">{title}</p>
      {description && (
        <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
