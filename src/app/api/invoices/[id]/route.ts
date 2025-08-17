import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: Context) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Get invoice with items
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error in GET /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const data = await request.json()

    // Update invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error in PUT /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}