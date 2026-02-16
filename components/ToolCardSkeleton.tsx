export default function ToolCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
      {/* Icon */}
      <div className="h-10 w-10 rounded-lg bg-gray-300 dark:bg-neutral-700 mb-4"></div>

      {/* Title */}
      <div className="h-4 w-3/4 bg-gray-300 dark:bg-neutral-700 rounded mb-2"></div>

      {/* Description */}
      <div className="h-3 w-full bg-gray-300 dark:bg-neutral-700 rounded mb-2"></div>
      <div className="h-3 w-5/6 bg-gray-300 dark:bg-neutral-700 rounded mb-4"></div>

      {/* Button */}
      <div className="h-8 w-full bg-gray-300 dark:bg-neutral-700 rounded"></div>
    </div>
  );
}
