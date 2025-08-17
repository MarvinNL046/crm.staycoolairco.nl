'use client'

import dynamic from 'next/dynamic'

// Dynamically import the component to ensure it's only rendered on the client
const NewInvoiceForm = dynamic(
  () => import('@/components/invoicing/NewInvoiceForm'),
  { 
    ssr: false,
    loading: () => <div className="p-6 text-center">Loading...</div>
  }
)

export default function NewInvoicePage() {
  return <NewInvoiceForm />
}