'use client'

import dynamic from 'next/dynamic'

// Dynamically import the component to ensure it's only rendered on the client
const InvoicingContent = dynamic(
  () => import('@/components/invoicing/InvoicingContent'),
  { 
    ssr: false,
    loading: () => <div className="p-6 text-center">Loading...</div>
  }
)

export default function InvoicingPage() {
  return <InvoicingContent />
}