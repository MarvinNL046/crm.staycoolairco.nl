import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const invoice_type = searchParams.get('invoice_type')
    const lead_id = searchParams.get('lead_id')
    const contact_id = searchParams.get('contact_id')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')

    // Build query
    let query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (invoice_type) {
      query = query.eq('invoice_type', invoice_type)
    }
    if (lead_id) {
      query = query.eq('lead_id', lead_id)
    }
    if (contact_id) {
      query = query.eq('contact_id', contact_id)
    }
    if (from_date) {
      query = query.gte('issue_date', from_date)
    }
    if (to_date) {
      query = query.lte('issue_date', to_date)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(invoices || [])
  } catch (error) {
    console.error('Error in GET /api/invoices:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Generate invoice number
    const currentYear = new Date().getFullYear()
    const prefix = data.invoice_type === 'quote' ? 'QTE' : 'INV'
    
    // Get the last invoice number for this type and year
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}-${currentYear}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastInvoice?.invoice_number) {
      const parts = lastInvoice.invoice_number.split('-')
      const lastNumber = parseInt(parts[2])
      nextNumber = lastNumber + 1
    }

    const invoice_number = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`

    // Create the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        ...data,
        invoice_number,
        subtotal_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        created_by: user.id,
        tenant_id: data.tenant_id || user.user_metadata?.tenant_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/invoices:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}