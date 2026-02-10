import { Skeleton } from '@/components/ui/skeleton'

export function DashboardLoading() {
  return (
    <div className="flex h-screen">
      <div className="hidden w-64 border-r bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b bg-white px-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1 bg-gray-50 p-6">
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
