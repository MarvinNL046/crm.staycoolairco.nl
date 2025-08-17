'use client'

import dynamic from 'next/dynamic'

const DarkModeTest = dynamic(
  () => import('../../../../tests/dark-mode-test'),
  { 
    ssr: false,
    loading: () => (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

export default function DarkModeTestPage() {
  return <DarkModeTest />
}