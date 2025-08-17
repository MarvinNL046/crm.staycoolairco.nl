import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: Context) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const data = await request.json()

    // Create the invoice item
    const { data: item, error } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: id,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        unit_price: data.unit_price,
        tax_rate: data.tax_rate,
        amount: data.quantity * data.unit_price,
        tax_amount: (data.quantity * data.unit_price) * (data.tax_rate / 100),
        total_amount: (data.quantity * data.unit_price) * (1 + data.tax_rate / 100)
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice item:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update invoice totals
    const { data: items } = await supabase
      .from('invoice_items')
      .select('amount, tax_amount, total_amount')
      .eq('invoice_id', id)

    if (items) {
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      const tax = items.reduce((sum: number, item: any) => sum + (item.tax_amount || 0), 0)
      const total = items.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0)

      await supabase
        .from('invoices')
        .update({
          subtotal_amount: subtotal,
          tax_amount: tax,
          total_amount: total
        })
        .eq('id', id)
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/invoices/[id]/items:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}