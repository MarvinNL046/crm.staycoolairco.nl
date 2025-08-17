import { NextResponse } from 'next/server'
import { Invoice } from '@/models/invoice'

export async function POST(request, { params }) {
  try {
    const invoice = await Invoice.convertQuoteToInvoice(params.id)
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}