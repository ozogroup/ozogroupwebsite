interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse bg-slate-200/80 rounded ${className}`} />;
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className="h-4 w-full max-w-[160px]" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-8 w-20 mt-4" />
      <Skeleton className="h-4 w-32 mt-2" />
    </div>
  );
}
