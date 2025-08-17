"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface CardSkeletonProps {
  showHeader?: boolean
  lines?: number
  showFooter?: boolean
}

export function CardSkeleton({ 
  showHeader = true, 
  lines = 3,
  showFooter = false 
}: CardSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
      )}
      
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={`h-4 ${
              i === 0 ? 'w-full' : 
              i === lines - 1 ? 'w-3/4' : 
              'w-5/6'
            }`} 
          />
        ))}
        
        {showFooter && (
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}