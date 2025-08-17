import { NextResponse } from 'next/server'
import { Invoice } from '@/models/invoice'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status'),
      invoice_type: searchParams.get('invoice_type'),
      lead_id: searchParams.get('lead_id'),
      contact_id: searchParams.get('contact_id'),
      from_date: searchParams.get('from_date'),
      to_date: searchParams.get('to_date')
    }

    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null) delete filters[key]
    })

    const invoices = await Invoice.getAll(filters)
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    const invoice = await Invoice.create(data)
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}