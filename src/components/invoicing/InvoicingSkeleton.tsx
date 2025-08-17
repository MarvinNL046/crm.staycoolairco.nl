"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { StatsSkeleton } from "@/components/ui/stats-skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export function InvoicingSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsSkeleton cards={4} />
      </div>

      {/* Table */}
      <TableSkeleton rows={8} columns={7} showHeader={true} />
    </div>
  )
}