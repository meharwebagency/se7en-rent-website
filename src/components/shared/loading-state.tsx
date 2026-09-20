import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  /** Optional label shown under the spinner. */
  label?: string;
  /** Use skeleton placeholders instead of a spinner. */
  skeleton?: boolean;
  className?: string;
}

export function LoadingState({
  label,
  skeleton = false,
  className,
}: LoadingStateProps) {
  if (skeleton) {
    return (
      <div
        className={cn(
          "grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
        role="status"
        aria-label={label}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
      role="status"
    >
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
