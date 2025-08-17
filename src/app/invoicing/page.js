'use client'

import dynamic from 'next/dynamic'
import { InvoicingSkeleton } from '@/components/invoicing/InvoicingSkeleton'

// Dynamically import the component to ensure it's only rendered on the client
const InvoicingContent = dynamic(
  () => import('@/components/invoicing/InvoicingContent'),
  { 
    ssr: false,
    loading: () => <InvoicingSkeleton />
  }
)

export default function InvoicingPage() {
  return <InvoicingContent />
}