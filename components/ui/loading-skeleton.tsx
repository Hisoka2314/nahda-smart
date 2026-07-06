import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-card bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100",
        className,
      )}
    />
  );
}
